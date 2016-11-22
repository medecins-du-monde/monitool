"use strict";

var Dimension = require('./dimension'),
	DimensionGroup = require('./dimension-group');


class Cube {

	static fromSerialization(obj) {
		return new Cube(obj.id, obj.dimensions, obj.dimensionGroups, obj.data);
	}

	static fromElement(project, form, element, inputs) {
		////////////
		// Build dimensions & groups
		////////////
		var dimensions = [], dimensionGroups = [];

		// Time
		dimensions.push(Dimension.createTime(project, form, element, inputs));
		['week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'year'].forEach(function(periodicity) {
			// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
			try {
				dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0]));
			}
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

		var data = new Array(dataSize)
		for (var i = 0; i < dataSize; ++i)
			data[i] = -2147483648;

		inputs.forEach(function(input) {
			// Compute location where this subtable should go, and length of data to copy.
			var offset = dimensions[0].items.indexOf(input.period),
				length = 1; // Slow!

			if (offset < 0) {
				console.log("Skip variable", element.id, 'from', input._id, "(did not find period in timeDim)");
				return;
			}

			if (form.collect == 'entity' || form.collect == 'some_entity') {
				if (dimensions[1].items.indexOf(input.entity) < 0) {
					console.log("Skip variable", element.id, 'from', input._id, "(did not find entity in spacialDim)");
					return;
				}

				offset = offset * dimensions[1].items.length + dimensions[1].items.indexOf(input.entity);
			}

			element.partitions.forEach(function(partition) {
				offset *= partition.elements.length;
				length *= partition.elements.length;
			});

			// Retrieve data from input, and copy (if valid).
			var source = input.values[element.id];
			if (!source || source.length !== length) {
				console.log("Skip variable", element.id, 'from', input._id, "(value size mismatch)");
				return;
			}
			
			// Copy into destination table.
			for (var i = 0; i < length; ++i)
				data[offset + i] = source[i];
		});

		// Build and fill cube
		return new Cube(element.id, dimensions, dimensionGroups, data);
	}


	/**
	 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
	 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
	 * data = [0, 1, 2, 3, ...]
	 */
	constructor(id, dimensions, dimensionGroups, data) {
		// Check size.
		var dataSize = 1;
		dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
		if (data.length !== dataSize)
			throw new Error('Invalid data size');

		this.id = id;
		this.dimensions = dimensions;
		this.dimensionGroups = dimensionGroups;
		this.data = data;

		// Index dimensions and dimensionGroups by id
		this.dimensionsById = {};
		this.dimensionGroupsById = {};
		this.dimensions.forEach(function(d) { this.dimensionsById[d.id] = d; }, this);
		this.dimensionGroups.forEach(function(d) { this.dimensionGroupsById[d.id] = d; }, this);
	}

	query(dimensionIds, filter, withTotals) {
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
	}


	/**
	 * filter = {year: ['2014'], partition1: ["2d31a636-1739-4b77-98a5-bf9b7a080626"]}
	 * returns integers
	 */
	_query_total(filter) {
		// rewrite the filter so that it contains only dimensions.
		filter = this._remove_dimension_groups(filter);
		filter = this._rewrite_as_indexes(filter);
		try {
			return this._query_rec(filter, 0);
		}
		catch (e) {
			return e.message;
		}
	}

	// FIXME we need to push/pop instead of shift/unshift (it's 10 times faster).
	_query_rec(allIndexes, offset) {
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
	}


	/**
	 * when querying the cube with _query_total(), we only support
	 * using dimensions (and not dimensionGroups).
	 * 
	 * This rewrites any filter so that they use dimensions.
	 */
	_remove_dimension_groups(oldFilters) {
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
	}

	_rewrite_as_indexes(filter) {
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
	}

	serialize() {
		return {
			id: this.id,
			dimensions: this.dimensions,
			dimensionGroups: this.dimensionGroups,
			data: this.data
		};
	}

}









module.exports = Cube;

