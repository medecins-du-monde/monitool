"use strict";

/**
 * Incredibly ineficient OLAP cube implementation.
 * No dynamic programming here to make it fast.
 * 
 * It should be good enought for what we need but implement this properly if too slow
 * (or find an implementation on the internet).
 *
 * Also, we should rename methods so that their names make sense to someone that uses olap cubes
 * (facts, measures, dimensions, slice, dice, ... instead of filter, query, etc)
 */
angular
	.module(
		'monitool.services.statistics.olap',
		[
			'monitool.services.utils.input-slots',
			'monitool.services.statistics.parser'
		]
	)

	.factory('Cube', function($http) {

		/**
		 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
		 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
		 * data = [0, 1, 2, 3, ...]
		 */
		var Cube = function(id, dimensions, dimensionGroups, data) {
			this.id = id;
			this.dimensions = dimensions;
			this.dimensionGroups = dimensionGroups;
			this.data = data;

			// Index dimensions and dimensionGroups by id
			this.dimensionsById = {};
			this.dimensionGroupsById = {};
			this.dimensions.forEach(function(d) { this.dimensionsById[d.id] = d; }.bind(this));
			this.dimensionGroups.forEach(function(d) {
				d.items = Object.keys(d.mapping);
				this.dimensionGroupsById[d.id] = d;
			}.bind(this));

			// Check size.
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
			if (this.data.length !== dataSize)
				throw new Error('Invalid data size');
		};

		Cube.fetchProject = function(projectId) {
			return $http({url: '/reporting/project/' + projectId}).then(function(cubes) {
				return cubes.data.cubes.map(function(c) {
					return new Cube(c.id, c.dimensions, c.dimensionGroups, c.data);
				})
			});
		};

		Cube.fetchIndicator = function(indicatorId) {
			return $http({url: '/reporting/indicator/' + indicatorId}).then(function(cubes) {
				cubes = cubes.data.cubes;

				var res = {};
				for (var projectId in cubes) {
					res[projectId] = cubes[projectId].map(function(c) {
						return new Cube(c.id, c.dimensions, c.dimensionGroups, c.data);
					});
				}

				return res;
			});
		};

		Cube.prototype.query = function(dimensionIds, filter, withTotals) {
			// End condition
			if (dimensionIds.length == 0)
				return this._query_total(filter);
			
			var dimensionId = dimensionIds.shift();

			// search dimension
			var dimension = this.dimensionsById[dimensionId] || this.dimensionGroupsById[dimensionId];

			// Build tree
			var result = {};
			var numDimensionItems = dimension.items.length;
			var contributions = 0;
			for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
				var dimensionItem = dimension.items[dimensionItemId];

				// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
				var oldFilter = filter[dimensionId];
				if (!oldFilter || oldFilter.indexOf(dimensionItem) !== -1)
					filter[dimensionId] = [dimensionItem];
				else
					// Either lines do the same. Continuing is a bit faster.
					// filter[dimensionId] = [];
					continue;
				
				// Compute branch of the result tree.
				result[dimensionItem] = this.query(dimensionIds, filter);

				// Remove if empty
				if (result[dimensionItem] === undefined)
					delete result[dimensionItem];
				else
					++contributions;

				// Restore filter to its former value
				if (oldFilter === undefined)
					delete filter[dimensionId];
				else
					filter[dimensionId] = oldFilter;
			}

			if (withTotals)
				result._total = this.query(dimensionIds, filter);

			dimensionIds.unshift(dimensionId);

			return contributions ? result : undefined;
		};

		Cube.prototype.flatQuery = function(dimensionIds, filter) {
			// End condition
			if (dimensionIds.length == 0)
				return this._query_total(filter);
			
			var dimensionId = dimensionIds.shift();

			// search dimension
			var dimension = this.dimensionsById[dimensionId] || this.dimensionGroupsById[dimensionId];

			// Build tree
			var result = {};
			var numDimensionItems = dimension.items.length;
			var contributions = 0;
			for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
				var dimensionItem = dimension.items[dimensionItemId];

				// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
				var oldFilter = filter[dimensionId];
				if (!oldFilter || oldFilter.indexOf(dimensionItem) !== -1)
					filter[dimensionId] = [dimensionItem];
				else
					// Either lines do the same. Continuing is a bit faster.
					// filter[dimensionId] = [];
					continue;
				
				// Compute branch of the result tree.
				result[dimensionItem] = this.flatQuery(dimensionIds, filter);

				// Remove if empty
				if (result[dimensionItem] === undefined)
					delete result[dimensionItem];
				else
					++contributions;

				// Restore filter to its former value
				if (oldFilter === undefined)
					delete filter[dimensionId];
				else
					filter[dimensionId] = oldFilter;
			}

			this.dimensionGroups.forEach(function(dimensionGroup) {
				if (dimensionGroup.childDimension !== dimension.id)
					return;

				var numDimensionItems = dimensionGroup.items.length;
				contributions = 0;
				for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
					var dimensionItem = dimensionGroup.items[dimensionItemId];

					// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
					var localFilter = angular.copy(filter);

					// FIXME this is kinda wrong, because a filter on the group may already exists.
					// this only works because we know that there are no such filter on the olap page.
					localFilter[dimensionGroup.id] = [dimensionItem];
					
					// Compute branch of the result tree.
					result[dimensionItem] = this.flatQuery(dimensionIds, localFilter);

					// Remove if empty
					if (result[dimensionItem] === undefined)
						delete result[dimensionItem];
					else
						++contributions;
				}
			}, this);

			result._total = this.flatQuery(dimensionIds, filter);

			dimensionIds.unshift(dimensionId);

			return contributions ? result : undefined;
		};

		/**
		 * filter = {year: ['2014'], partition1: ["2d31a636-1739-4b77-98a5-bf9b7a080626"]}
		 * returns integers
		 */
		Cube.prototype._query_total = function(filter) {
			// rewrite the filter so that it contains only dimensions.
			filter = this._remove_dimension_groups(filter);
			filter = this._rewrite_as_indexes(filter);
			try {
				return Math.round(this._query_rec(filter, 0));
			}
			catch (e) {
				return e.message;
			}
		};

		// FIXME we need to push/pop instead of shift/unshift (it's 10 times faster).
		Cube.prototype._query_rec = function(allIndexes, offset) {
			if (allIndexes.length == 0)
				return this.data[offset] == -2147483648 ? undefined : this.data[offset];

			var dimension  = this.dimensions[this.dimensions.length - allIndexes.length],
				indexes    = allIndexes.shift(),
				numIndexes = indexes.length;

			var result, tmp, contributions = 0;
			
			// Compute offset at this level.
			offset *= dimension.items.length;

			// Aggregate
			if (dimension.aggregation == 'sum') {
				result = 0;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i])
					if (tmp !== undefined) {
						++contributions;
						result += tmp
					}
				}
			}
			else if (dimension.aggregation == 'average') {
				result = 0;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i])
					if (tmp !== undefined) {
						++contributions;
						result += tmp
					}
				}
				result /= contributions;
			}
			else if (dimension.aggregation == 'highest') {
				result = -Number.MAX_VALUE;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i]);
					if (tmp !== undefined && tmp > result) {
						++contributions;
						result = tmp;
					}
				}
			}
			else if (dimension.aggregation == 'lowest') {
				result = Number.MAX_VALUE;
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i])
					if (tmp !== undefined && tmp < result) {
						++contributions;
						result = tmp;
					}
				}
			}
			else if (dimension.aggregation == 'last') {
				for (var i = numIndexes - 1; i >= 0; --i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i])
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
						break; // first defined value is OK for us.
					}
				}
			}

			else if (dimension.aggregation == 'none') {
				for (var i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(allIndexes, offset + indexes[i])
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
					}
				}

				if (contributions > 1)
					throw new Error('AGGREGATION_FORBIDDEN');
			}

			else
				throw new Error('INVALID_AGGREGATION_MODE');

			if (contributions == 0)
				result = undefined;

			allIndexes.unshift(indexes)

			return result;
		};


		/**
		 * when querying the cube with _query_total(), we only support
		 * using dimensions (and not dimensionGroups).
		 * 
		 * This rewrites any filter so that they use dimensions.
		 */
		Cube.prototype._remove_dimension_groups = function(oldFilters) {
			var newFilters = {};

			for (var dimensionId in oldFilters) {
				var dimension = this.dimensionsById[dimensionId],
					oldFilter = oldFilters[dimensionId];

				// if the dimension exists, we have nothing to do.
				if (dimension) {
					// Insersect our new filter with the existing one.
					if (!newFilters[dimension.id])
						newFilters[dimension.id] = oldFilter;
					else
						newFilters[dimension.id] = oldFilter.filter(function(e) {
							return newFilters[dimension.id].indexOf(e) !== -1;
						});
				}
				// the dimension does not exists.
				else {
					var dimensionGroup = this.dimensionGroupsById[dimensionId];

					// if it's a group, replace it.
					if (dimensionGroup) {
						// Build new filter by concatenating elements.
						var newFilter = [];
						oldFilter.forEach(function(v) { Array.prototype.push.apply(newFilter, dimensionGroup.mapping[v]); });
						newFilter.sort();
						
						// If there are duplicates, remove them.
						var i = newFilter.length - 2;
						while (i > 0) {
							if (newFilter[i] == newFilter[i + 1])
								newFilter.splice(i, 1);
							--i
						}

						// Insersect our new filter with the existing one.
						if (!newFilters[dimensionGroup.childDimension])
							newFilters[dimensionGroup.childDimension] = newFilter;
						else
							newFilters[dimensionGroup.childDimension] = newFilter.filter(function(e) {
								return newFilters[dimensionGroup.childDimension].indexOf(e) !== -1;
							});
					}
					// if it's not a dimension nor a dimensionGroup, raise.
					else
						throw new Error('Invalid dimension in filter: ' + dimensionId);
				}
			}

			return newFilters;
		};

		Cube.prototype._rewrite_as_indexes = function(filter) {
			// Rewrite the filter again in the form of integers.
			// We don't want to rewrite it into the _query_rec function, because it is
			// more efficient to do it only once here, instead of many times on the rec function.
			return this.dimensions.map(function(dimension) {
				var i, result, size;

				// No filter => filter is range(0, dimension.items.length)
				if (!filter[dimension.id]) {
					size = dimension.items.length;
					result = new Int32Array(size);
					for (i = 0; i < size; ++i)
						result[i] = i;
				}
				// Yes filter => map strings to ids in the real query.
				else {
					// Now we need to map our list of strings to indexes.
					size = filter[dimension.id].length;
					result = new Int32Array(size);
					for (i = 0; i < size; ++i) {
						result[i] = dimension.items.indexOf(filter[dimension.id][i]);
						if (result[i] === -1)
							throw new Error('Dimension item "' + filter[dimension.id][i] + '" was not found.');
					}
				}

				return result;
			});
		};

		return Cube;
	})

	.factory("CompoundCube", function(Cube, Parser) {
		

		var createDimension = function(dimensionId, childDimension, computation, cubes) {
			// Take all lists of items from the real dimensions
			var itemsLists = [];
			for (var key in computation.parameters) {
				var cube = cubes[computation.parameters[key].elementId],
					dimension = cube.dimensionsById[dimensionId] || cube.dimensionGroupsById[dimensionId];

				itemsLists.push(dimension.items);
			}

			// intersect them
			var items = itemsLists.reduce(function(memo, arr) {
				return memo == null ? arr.slice() : memo.filter(function(el) { return arr.indexOf(el) !== -1; });
			}, null) || [];

			// sort what remains (why? those the display order depends on this one?)
			items.sort();
			
			// our new dimension is the intersection of all the others (child dimension might be undefined but that's ok)
			return {id: dimensionId, childDimension: childDimension, items: items};				
		};

		var CompoundCube = function(computation, cubes) {
			this.computation = computation;
			
			this.cubes = {}; // we could leave everything here, but it's easier to debug with less clutter.
			for (key in computation.parameters)
				this.cubes[computation.parameters[key].elementId] = cubes[computation.parameters[key].elementId];
			
			this.dimensions = [];
			this.dimensionGroups = [];

			// The dimensions that our CompoundCube will have is the intersection of the dimensions
			// of all of the other cubes => compute that.
			// first: retrieve all dimensions and groups for parameters of computation
			var dimensionIds = [];
			for (var key in computation.parameters) {
				var cube = cubes[computation.parameters[key].elementId],
					dimensions = Object.keys(cube.dimensionsById).concat(Object.keys(cube.dimensionGroupsById));

				dimensionIds.push(dimensions);
			}

			// intersect them to know which dimensions we have left (FIXME: why not depend on itertools.intersect?).
			dimensionIds = dimensionIds.reduce(function(memo, arr) {
				return memo == null ? arr.slice() : memo.filter(function(el) { return arr.indexOf(el) !== -1; });
			}, null) || [];

			// create fake dimensions and groups to mimic the intersection of the cubes.
			if (dimensionIds.indexOf('day') !== -1) {
				this.dimensions.push(createDimension('day', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('week_sat', 'day', computation, cubes));
				this.dimensionGroups.push(createDimension('week_sun', 'day', computation, cubes));
				this.dimensionGroups.push(createDimension('week_mon', 'day', computation, cubes));
				this.dimensionGroups.push(createDimension('month', 'day', computation, cubes));
				this.dimensionGroups.push(createDimension('quarter', 'day', computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'day', computation, cubes));
			}
			else if (dimensionIds.indexOf('week_sat') !== -1) {
				this.dimensions.push(createDimension('week_sat', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('month', 'week_sat', computation, cubes));
				this.dimensionGroups.push(createDimension('quarter', 'week_sat', computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'week_sat', computation, cubes));
			}
			else if (dimensionIds.indexOf('week_sun') !== -1) {
				this.dimensions.push(createDimension('week_sun', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('month', 'week_sun', computation, cubes));
				this.dimensionGroups.push(createDimension('quarter', 'week_sun', computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'week_sun', computation, cubes));
			}
			else if (dimensionIds.indexOf('week_mon') !== -1) {
				this.dimensions.push(createDimension('week_mon', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('month', 'week_mon', computation, cubes));
				this.dimensionGroups.push(createDimension('quarter', 'week_mon', computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'week_mon', computation, cubes));
			}
			else if (dimensionIds.indexOf('month') !== -1) {
				this.dimensions.push(createDimension('month', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('quarter', 'month', computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'month', computation, cubes));
			}
			else if (dimensionIds.indexOf('quarter') !== -1) {
				this.dimensions.push(createDimension('quarter', undefined, computation, cubes));
				this.dimensionGroups.push(createDimension('year', 'quarter', computation, cubes));
			}
			else {
				this.dimensions.push(createDimension('year', undefined, computation, cubes));
			}

			if (dimensionIds.indexOf('entity') !== -1) {
				this.dimensions.push(createDimension('entity', undefined, computation, cubes));

				if (dimensionIds.indexOf('group') !== -1)
					this.dimensionGroups.push(createDimension('group', 'entity', computation, cubes));
			}

			// Index dimensions and dimensionGroups by id
			this.dimensionsById = {};
			this.dimensionGroupsById = {};
			this.dimensions.forEach(function(d) { this.dimensionsById[d.id] = d; }.bind(this));
			this.dimensionGroups.forEach(function(d) { this.dimensionGroupsById[d.id] = d; }.bind(this));
		};

		CompoundCube.prototype.query = Cube.prototype.query;
		
		CompoundCube.prototype.flatQuery = Cube.prototype.flatQuery;

		CompoundCube.prototype._query_total = function(filter) {
			var localScope = {};

			for (var key in this.computation.parameters) {
				var parameter = this.computation.parameters[key],
					cube = this.cubes[parameter.elementId];

				var finalFilter = angular.copy(filter)
				for (var key2 in parameter.filter)
					finalFilter[key2] = parameter.filter[key2];

				localScope[key] = cube._query_total(finalFilter);
				if (typeof localScope[key] !== 'number') // undefined, 'AGGREGATION_FORBIDDEN', 'INVALID_AGGREGATION_MODE'
					return localScope[key];
			}

			try {
				return Parser.evaluate(this.computation.formula, localScope);
			}
			catch (e) {
				return 'INVALID_FORMULA';
			}
		};

		return CompoundCube;
	})

