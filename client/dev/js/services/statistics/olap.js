"use strict";

/**
 * Incredibly ineficient OLAP cube implementation.
 * No cache, trees, contiguous buffers that could make this fast.
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
			'monitool.services.utils.input-slots'
		]
	)

	.factory('Olap', function(InputSlots) {

		/**
		 * id = "month"
		 * items = ["2010-01", "2010-02", ...]
		 * aggregation = "sum"
		 */
		var Dimension = function(id, items, aggregation) {
			this.id = id;
			this.items = items;
			this.aggregation = aggregation;
		};

		Dimension.createTime = function(project, form, element, inputs) {
			var periods;

			if (form.periodicity === 'free') {
				periods = {};
				inputs.forEach(function(input) { periods[input.period] = true; });
				periods = Object.keys(periods);
				periods.sort();

				return new Dimension('day', periods, element.timeAgg);
			}
			else {
				periods = InputSlots.getList(project, null, form);
				return new Dimension(form.periodicity, periods, element.timeAgg);
			}
		};

		Dimension.createLocation = function(project, form, element) {
			var entities;
			if (form.collect == 'some_entity')
				entities = form.entities;
			else if (form.collect == 'entity')
				entities = project.entities.pluck('id');

			if (!entities)
				throw new Error('No location dimension');
			else
				return new Dimension('entity', entities, element.geoAgg);
		};

		Dimension.createPartition = function(partition) {
			return new Dimension(partition.id, partition.elements.pluck('id'), partition.aggregation);
		};

		var DimensionGroup = function(id, childDimension, mapping) {
			this.id = id;
			this.childDimension = childDimension;
			this.items = Object.keys(mapping);
			this.mapping = mapping;
		};

		DimensionGroup.createTime = function(parent, dimension) {
			// Constants. Should go in a configuration file somewhere.
			var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};
			var timeDimensions = Object.keys(formats);

			// Check arguments
			if (timeDimensions.indexOf(parent) === -1)
				throw new Error(parent + ' is not a valid time dimension.');

			if (timeDimensions.indexOf(dimension.id) === -1)
				throw new Error(dimension.id + ' is not a valid time dimension');

			if (timeDimensions.indexOf(parent) >= timeDimensions.indexOf(dimension.id))
				throw new Error('Cannot compute ' + parent + ' from ' + dimension.id);

			// Create DimensionGroup mapping from Dimension items.
			var childFormat = formats[dimension.id], parentFormat = formats[parent];
			var mapping = {};

			dimension.items.forEach(function(childValue) {
				var parentValue = moment.utc(childValue, childFormat).format(parentFormat);

				mapping[parentValue] = mapping[parentValue] || [];
				mapping[parentValue].push(childValue);
			});

			return new DimensionGroup(parent, dimension.id, mapping);
		};

		DimensionGroup.createLocation = function(project, form) {
			var entities;
			if (form.collect == 'some_entity')
				entities = form.entities;
			else if (form.collect == 'entity')
				entities = project.entities.pluck('id');

			var groups = {};
			project.groups.forEach(function(group) {
				groups[group.id] = group.members.filter(function(id) {
					return entities.indexOf(id) !== -1;
				});

				if (groups[group.id].length === 0)
					delete groups[group.id];
			});

			return new DimensionGroup('group', 'entity', groups);
		};

		DimensionGroup.createPartition = function(partition) {
			var pgroups = {};
			partition.groups.forEach(function(g) { pgroups[g.id] = g.members; });
			return new DimensionGroup(partition.id + '_g', partition.id, pgroups);
		};

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
			this.dimensionGroups.forEach(function(d) { this.dimensionGroupsById[d.id] = d; }.bind(this));

			// Check size.
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
			if (this.data.length !== dataSize)
				throw new Error('Invalid data size');
		};

		Cube.fromElement = function(project, form, element, inputs) {
			////////////
			// Build dimensions & groups
			////////////
			var dimensions = [], dimensionGroups = [];

			// Time
			dimensions.push(Dimension.createTime(project, form, element, inputs));
			['week', 'month', 'quarter', 'year'].forEach(function(periodicity) {
				// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
				try { dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0])); }
				catch (e) {}
			});
			
			// Location
			if (form.collect == 'entity' || form.collect == 'some_entity') {
				dimensions.push(Dimension.createLocation(project, form, element));
				if (project.groups.length)
					dimensionGroups.push(DimensionGroup.createLocation(project, form))
			}

			// Partitions
			element.partitions.forEach(function(partition) {
				dimensions.push(Dimension.createPartition(partition));
				if (partition.groups.length)
					dimensionGroups.push(DimensionGroup.createPartition(partition));
			});

			////////////
			// Build data
			////////////
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });

			var data = new Int32Array(dataSize)
			for (var i = 0; i < dataSize; ++i)
				data[i] = -2147483648;

			inputs.forEach(function(input) {
				// Compute location where this subtable should go, and length of data to copy.
				var offset = dimensions[0].items.indexOf(input.period),
					length = 1; // Slow!

				if (offset < 0)
					console.log(offset)

				if (form.collect == 'entity' || form.collect == 'some_entity') {
					if (dimensions[1].items.indexOf(input.entity) < 0)
						console.log('WTF')

					offset = offset * dimensions[1].items.length + dimensions[1].items.indexOf(input.entity);
				}

				element.partitions.forEach(function(partition) {
					offset *= partition.elements.length;
					length *= partition.elements.length;
				});

				// Retrieve data from input, and copy (if valid).
				var source = input.values[element.id];
				if (source && source.length === length) {
					// Copy into destination table.
					for (var i = 0; i < length; ++i)
						data[offset + i] = source[i];
				}
				else {
					console.log("Skip variable", element.id, 'from', input._id);
				}
			});

			// Build and fill cube
			return new Cube(element.id, dimensions, dimensionGroups, data);
		};

		Cube.fromProject = function(project, allInputs) {
			var inputsByForm = {};
			project.forms.forEach(function(form) { inputsByForm[form.id] = [] });
			allInputs.forEach(function(input) { inputsByForm[input.form].push(input); });

			var cubes = {};
			project.forms.forEach(function(form) {
				var inputs = inputsByForm[form.id];
				
				form.elements.forEach(function(element) {
					cubes[element.id] = Cube.fromElement(project, form, element, inputs);
				});
			});

			return cubes;
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
				// var contributions = 0;
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
		 */
		Cube.prototype._query_total = function(filter) {
			// rewrite the filter so that it contains only dimensions.
			filter = this._remove_dimension_groups(filter);
			filter = this._rewrite_as_indexes(filter);
			return this._query_rec(filter, 0);
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
					result = NaN;
			}

			else
				throw new Error('Invalid mode: ' + dimension.aggregation);

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

		return {Dimension: Dimension, DimensionGroup: DimensionGroup, Cube: Cube}
	});

