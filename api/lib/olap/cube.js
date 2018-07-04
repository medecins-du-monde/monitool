/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import winston from 'winston';
import Dimension from './dimension';
import DimensionGroup from './dimension-group';

/**
 * This class represents an [OLAP Cube](https://en.wikipedia.org/wiki/OLAP_cube)
 */
export default class Cube {

	/**
	 * Create a cube from the result of the serialize() method.
	 *
	 * @param {Object} obj Object retrieved by calling the serialize method on a Cube instance.
	 * @return {Cube}
	 *
	 * @example
	 * let c   = new Cube(...),
	 *     str = JSON.stringify(c.serialize()),
	 *     obj = JSON.parse(str),
	 *     c2  = Cube.fromSerialization(obj);
	 */
	static fromSerialization(obj) {
		return new Cube(obj.id, obj.dimensions, obj.dimensionGroups, obj.data);
	}

	/**
	 * Create a cube from a data source element and all known inputs of the data source.
	 *
	 * @param {Project} project
	 * @param {DataSource} form
	 * @param {Variable} element
	 * @param {Array.<Input>} inputs
	 * @return {Cube}
	 *
	 * @example
	 * let projectId = '6acefb96-a047-4b77-a698-6a9da3994306';
	 *
	 * Project.store.get(projectId).then(function(project) {
	 *     Input.listByDataSource(projectId, project.forms[0].id).then(function(inputs) {
	 *         let c =  = Cube.fromElement(project, project.forms[0], project.forms[0].element[0], inputs);
	 *         // do stuff here
	 *     });
	 * });
	 */
	static fromElement(project, form, element, inputs) {
		////////////
		// Build dimensions & groups
		////////////
		var dimensions = [], dimensionGroups = [];

		// Time
		dimensions.push(Dimension.createTime(project, form, element));
		['week_sat', 'week_sun', 'week_mon', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'month', 'quarter', 'semester', 'year'].forEach(periodicity => {
			// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
			try {
				dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0]));
			}
			catch (e) {}
		});

		// Location
		dimensions.push(Dimension.createLocation(project, form, element));
		if (project.groups.length)
			dimensionGroups.push(DimensionGroup.createLocation(project, form))

		// Disaggregations
		element.partitions.forEach(partition => {
			dimensions.push(Dimension.createPartition(partition));
			if (partition.groups.length)
				dimensionGroups.push(DimensionGroup.createPartition(partition));
		});

		////////////
		// Build data
		////////////
		var dataSize = 1;
		dimensions.forEach(dimension => dataSize *= dimension.items.length);

		// var data = {};
		var data = new Array(dataSize)
		for (var i = 0; i < dataSize; ++i)
			data[i] = -2147483648;

		inputs.forEach(input => {
			// Compute location where this subtable should go, and length of data to copy.
			var offset = dimensions[0].items.indexOf(input.period),
				length = 1; // Slow!

			if (offset < 0) {
				winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(did not find period in timeDim)");
				return;
			}

			if (dimensions[1].items.indexOf(input.entity) < 0) {
				winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(did not find entity in spacialDim)");
				return;
			}
			offset = offset * dimensions[1].items.length + dimensions[1].items.indexOf(input.entity);

			element.partitions.forEach(partition => {
				offset *= partition.elements.length;
				length *= partition.elements.length;
			});

			// Retrieve data from input, and copy (if valid).
			var source = input.values[element.id];
			if (!source) {
				winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(value missing)");
				return;
			}

			if (source.length !== length) {
				winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(value size mismatch expected", length, ", found", source.length, ")");
				return;
			}

			// Copy into destination table.
			// data[offset] = source;
			for (var i = 0; i < length; ++i)
				data[offset + i] = source[i];
		});

		var keys = Object.keys(data);
		keys.sort((a, b) => a * 1 - b * 1)

		for (var i = keys.length - 1; i > 0; --i) {
			var key = keys[i - 1], nextKey = keys[i];

			if (key * 1 + data[key].length == nextKey) {
				data[key] = [...data[key], ...data[nextKey]];
				delete data[nextKey];
			}
		}

		// Build and fill cube
		return new Cube(element.id, dimensions, dimensionGroups, data);
	}

	/**
	 * Build a cube from it's components
	 *
	 * @param {string} id A unique identifier for this cube across the application.
	 * @param {Array.<Dimension>} dimensions The list of dimensions that this cube is using
	 * @param {Array.<DimensionGroup>} dimensionGroups The list of dimension groups that this cube is using
	 * @param {Array.<number>} data Data contained in the cube. The size of this array must be the product of the number of elements in the dimension.
	 *
	 * @example
	 * var time = new Dimension('year', ['2013', '2014', '2015'], 'sum'),
	 *     location = new Dimension('location', ['shopA', 'shopB'], 'sum');
	 *
	 * var c = new Cube('sells', [time, location], [], [10, 20, 30, 15, 43, 60]);
	 */
	constructor(id, dimensions, dimensionGroups, data) {
		// Check size.
		// var dataSize = 1;
		// dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
		// if (data.length !== dataSize)
		// 	throw new Error('Invalid data size');

		this.id = id;
		this.dimensions = dimensions;
		this.dimensionGroups = dimensionGroups;
		this.data = data;

		// Index dimensions and dimensionGroups by id
		this.dimensionsById = {};
		this.dimensionGroupsById = {};
		this.dimensions.forEach(d => this.dimensionsById[d.id] = d);
		this.dimensionGroups.forEach(d => this.dimensionGroupsById[d.id] = d);
	}

	/**
	 * Query this cube splitting the result by the provided dimension ids and filters.
	 *
	 * @param {Array.<number>} dimensionIds Dimension to distribute the result
	 * @param {Object.<string, Array.<string>>} filters Elements that should be included by dimension. Missing dimensions are not filtered.
	 * @param {boolean} [withTotals=false] Include an additional "total" key at every level
	 * @return {Object|number} An nested object which contain total value in each dimensionElement.
	 *
	 * @example
	 * var c = new Cube(...);
	 *
	 * c.query();
	 * // 178
	 *
	 * c.query(['year']);
	 * // {2013: 25, 2014: 63, 2015: 90}
	 *
	 * c.query(['year', 'location']);
	 * // {2013: {shopA: 10, shopB: 20}, 2014: {shopA: 30, shopB: 15}, 2015: {shopA: 43, shopB: 60}}
	 *
	 * c.query(['year', 'location'], {year: ['2013', '2014']}, true);
	 * // {2013: {shopA: 10, shopB: 20, _total: 30}, 2014: {shopA: 30, shopB: 15, _total: 45}, _total: 75}
	 */
	query(dimensionIds, filter, withTotals, withGroups) {
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
			if (!oldFilter || oldFilter.includes(dimensionItem))
				filter[dimensionId] = [dimensionItem];
			else
				// Either lines do the same. Continuing is a bit faster.
				// filter[dimensionId] = [];
				continue;

			// Compute branch of the result tree.
			result[dimensionItem] = this.query(dimensionIds, filter, withTotals, withGroups);

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

		if (withGroups)
			this.dimensionGroups
				.filter(dg => dg.childDimension === dimension.id)
				.forEach(dimensionGroup => {

				var numDimensionItems = dimensionGroup.items.length;
				contributions = 0;
				for (var dimensionItemId = 0; dimensionItemId < numDimensionItems; ++dimensionItemId) {
					var dimensionItem = dimensionGroup.items[dimensionItemId];

					// Intersect main filter with branch filter (branch filter is only one item, so it's easy to compute).
					var localFilter = Object.assign({}, filter);

					// FIXME this is kinda wrong, because a filter on the group may already exists.
					// this only works because we know that there are no such filter on the olap page.
					localFilter[dimensionGroup.id] = [dimensionItem];

					// Compute branch of the result tree.
					result[dimensionItem] = this.query(dimensionIds, localFilter, withTotals, withGroups);

					// Remove if empty
					if (result[dimensionItem] === undefined)
						delete result[dimensionItem];
					else
						++contributions;
				}
			});


		if (withTotals)
			result._total = this.query(dimensionIds, filter, withTotals);

		dimensionIds.unshift(dimensionId);

		return contributions ? result : undefined;
	}

	/**
	 * Retrieve the total value matching a given filter.
	 *
	 * @private
	 * @param {Object.<string, Array.<string>>} filter Elements that should be included by dimension. Missing dimensions are not filtered.
	 * @return {number} total value matching the provided filter.
	 *
	 * @example
	 * let cube = Cube.fromSerialization(...);
	 * let result = cube._query_total({year: ['2014'], "bc4b0c3f-ee9d-4507-87ad-6eaea9102cd9": ["2d31a636-1739-4b77-98a5-bf9b7a080626"]})
	 * result // 2321
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

	/**
	 * Retrieve the total value matching given indexes and read offset.
	 *
	 * @private
	 * @todo Would be faster to use push/pop instead of shift/unshift into the indexes.
	 *
	 * @param  {Array.<Array.<number>>}
	 * @param  {number}
	 * @return {number|undefined}
	 *
	 * @example
	 * var c = new Cube('sells', [time, location], [], [0, 1, 2, 3, 4, 5, 6]);
	 * c._query_rec([], 0); // 0
	 * c._query_rec([], 2); // 2
	 *
	 * c._query_rec([[1, 2]], 0); // 3
	 * c._query_rec([[0], [0]], 5); // 5
	 */
	_query_rec(allIndexes, offset) {
		if (Number.isNaN(offset))
			return undefined;

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
	 * When querying the cube with _query_total(), we only support
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
					newFilters[dimension.id] = oldFilter.filter(e => {
						return newFilters[dimension.id].includes(e);
					});
			}
			// the dimension does not exists.
			else {
				var dimensionGroup = this.dimensionGroupsById[dimensionId];

				// if it's a group, replace it.
				if (dimensionGroup) {
					// Build new filter by concatenating elements.
					var newFilter = [];
					oldFilter.forEach(function(v) {
						newFilter.push(...dimensionGroup.mapping[v]);
					});
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
							return newFilters[dimensionGroup.childDimension].includes(e);
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
				result = new Array(size);
				for (i = 0; i < size; ++i)
					result[i] = i;
			}
			// Yes filter => map strings to ids in the real query.
			else {
				// Now we need to map our list of strings to indexes.
				size = filter[dimension.id].length;
				result = new Array(size);
				for (i = 0; i < size; ++i) {
					result[i] = dimension.items.indexOf(filter[dimension.id][i]);
					if (result[i] === -1)
						result[i] = NaN;
						// throw new Error('Dimension item "' + filter[dimension.id][i] + '" was not found.');
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

