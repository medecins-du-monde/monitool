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
		[]
	)

	.factory('Olap', function() {

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

		var DimensionGroup = function(id, childDimension, mapping) {
			this.id = id;
			this.childDimension = childDimension;
			this.items = Object.keys(mapping);
			this.mapping = mapping;
		};

		/**
		 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
		 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
		 * data = [ElementaryCube(...), ElementaryCube(...), ElementaryCube(...), ...]
		 */
		var Cube = function(id, dimensions, dimensionGroups, data) {
			this.id = id;
			this.dimensions = dimensions;
			this.dimensionGroups = dimensionGroups;
			this.data = data;

			// Check size.
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
			if (!data)
				this.data = new Array(dataSize);
			else if (data.length !== dataSize)
				throw new Error('Invalid data size');
		};

		Cube.prototype._getDimension = function(dimensionId) {
			var dimension, numDimension = this.dimensions.length;
			for (var dimensionIndex = 0; dimensionIndex < numDimension; ++dimensionIndex)
				if (this.dimensions[dimensionIndex].id == dimensionId) {
					dimension = this.dimensions[dimensionIndex];
					break;
				}

			return dimension;
		};

		Cube.prototype._getDimensionGroup = function(dimensionGroupId) {
			var dimensionGroup, numDimensionGroups = this.dimensionGroups.length;
			for (var dimensionGroupIndex = 0; dimensionGroupIndex < numDimensionGroups; ++dimensionGroupIndex)
				if (this.dimensionGroups[dimensionGroupIndex].id == dimensionGroupId) {
					dimensionGroup = this.dimensionGroups[dimensionGroupIndex];
					break;
				}

			return dimensionGroup;
		};

		Cube.fromProject = function(project, allInputs) {
			var inputsByForm = {};
			project.forms.forEach(function(form) { inputsByForm[form.id] = [] });
			allInputs.forEach(function(input) { inputsByForm[input.form].push(input); });

			var cubes = {};
			project.forms.forEach(function(form) {
				var inputs = inputsByForm[form.id];
				
				// create entity dimension if relevant (once for the element).
				var entities = null, groups = null;
				if (form.collect == 'entity' || form.collect == 'some_entity') {
					entities = project.entities.pluck('id');
					groups = {};
					project.groups.forEach(function(group) { groups[group.id] = group.members; });
				}
				
				var days = {}; // dimension
				var weeks = {}, months = {}, quarters = {}, years = {}; // dimensionGroups
				inputs.forEach(function(i) {
					var period = moment.utc(i.period);
					var day = period.format('YYYY-MM-DD'),
						week = period.format('YYYY-[W]WW'),
						month = period.format('YYYY-MM'),
						quarter = period.format('YYYY-[Q]Q'),
						year = period.format('YYYY');

					if (!weeks[week]) weeks[week] = {};
					if (!months[month]) months[month] = {};
					if (!quarters[quarter]) quarters[quarter] = {};
					if (!years[year]) years[year] = {};

					days[day] = true;
					weeks[week][day] = true;
					months[month][day] = true;
					quarters[quarter][day] = true;
					years[year][day] = true;
				});

				days = Object.keys(days);
				for (var week in weeks) weeks[week] = Object.keys(weeks[week]);
				for (var month in months) months[month] = Object.keys(months[month]);
				for (var quarter in quarters) quarters[quarter] = Object.keys(quarters[quarter]);
				for (var year in years) years[year] = Object.keys(years[year]);

				// Create empty cubes
				form.elements.forEach(function(element) {
					// Create dimensions.
					var dimensions = [];
					dimensions.push(new Dimension('day', days, element.timeAgg));
					if (form.collect == 'entity' || form.collect == 'some_entity')
						dimensions.push(new Dimension('entity', entities, element.geoAgg));

					element.partitions.forEach(function(partition, index) {
						dimensions.push(new Dimension(partition.id, partition.elements.pluck('id'), partition.aggregation));
					});

					var dimensionGroups = [
						new DimensionGroup('week', 'day', weeks),
						new DimensionGroup('month', 'day', months),
						new DimensionGroup('quarter', 'day', quarters),
						new DimensionGroup('year', 'day', years)
					];

					if (form.collect == 'entity' || form.collect == 'some_entity')
						dimensionGroups.push(new DimensionGroup('group', 'entity', groups));

					element.partitions.forEach(function(partition, index) {
						if (partition.groups.length) {
							var pgroups = {};
							partition.groups.forEach(function(g) { pgroups[g.id] = g.members; });
							dimensionGroups.push(new DimensionGroup(partition.id + '_g', partition.id, pgroups));
						}
					});

					cubes[element.id] = new Cube(element.id, dimensions, dimensionGroups);
				});

				// Fill cubes
				inputs.forEach(function(input) {
					var period = moment.utc(input.period).format('YYYY-MM-DD');

					form.elements.forEach(function(element) {
						// Compute location where this subtable should go, and length of data to copy.
						var offset = days.indexOf(period); // FIXME slow & useless
						var length = 1;

						if (form.collect == 'entity' || form.collect == 'some_entity')
							offset = offset * entities.length + entities.indexOf(input.entity);

						element.partitions.forEach(function(partition) {
							offset *= partition.elements.length;
							length *= partition.elements.length;
						});

						// Retrieve data from input, and copy (if valid).
						var source = input.values[element.id];
						if (source && source.length === length) {
							var target = cubes[element.id].data;

							// Copy into destination table.
							for (var i = 0; i < length; ++i)
								target[offset + i] = source[i];
						}
						else {
							console.log("Skip variable", element.id, 'from', input._id);
						}
					});

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
			var dimension = this._getDimension(dimensionId) || this._getDimensionGroup(dimensionId);

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
			var dimension = this._getDimension(dimensionId) || this._getDimensionGroup(dimensionId);

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
				return this.data[offset];

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
				var dimension = this._getDimension(dimensionId),
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
					var dimensionGroup = this._getDimensionGroup(dimensionId);

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
				var i, result;

				// No filter => filter is range(0, dimension.items.length)
				if (!filter[dimension.id]) {
					result = new Array(dimension.items.length);
					for (i = 0; i < result.length; ++i)
						result[i] = i;
				}
				// Yes filter => map strings to ids in the real query.
				else {
					// Now we need to map our list of strings to indexes.
					result = new Array(filter[dimension.id].length);
					for (i = 0; i < result.length; ++i)
						result[i] = dimension.items.indexOf(filter[dimension.id][i]);
				}

				return result;
			});
		};

		return {Dimension: Dimension, DimensionGroup: DimensionGroup, Cube: Cube}
	});

