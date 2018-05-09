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


import axios from 'axios';

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
export default class Cube {

	static async fetchProject(projectId) {
		const response = await axios.get('/api/reporting/project/' + projectId);

		return response.data.cubes.map(c => {
			return new Cube(c.id, c.dimensions, c.dimensionGroups, c.data);
		});
	}

	static async fetchIndicator(indicatorId) {
		const response = await axios.get('/api/reporting/indicator/' + indicatorId);
		const cubes = response.data.cubes;

		var res = {};
		for (var projectId in cubes) {
			res[projectId] = cubes[projectId].map(function(c) {
				return new Cube(c.id, c.dimensions, c.dimensionGroups, c.data);
			});
		}

		return res;
	}

	/**
	 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
	 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
	 * data = [0, 1, 2, 3, ...]
	 */
	constructor(id, dimensions, dimensionGroups, data) {
		this.id = id;
		this.dimensions = dimensions;
		this.dimensionGroups = dimensionGroups;

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

		this.data = new Array(dataSize);
		for (var offset in data) {
			offset = offset * 1;
			var lst = data[offset], lstLength = lst.length;

			for (var i = 0; i < lstLength; ++i)
				this.data[offset + i] = lst[i];
		}
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

	flatQuery(dimensionIds, filter) {
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
			var res = this._query_rec(filter, 0);
			return typeof res === 'number' ? Math.round(res) : res;
		}
		catch (e) {
			return e.message;
		}
	}

	// FIXME we need to push/pop instead of shift/unshift (it's 10 times faster).
	_query_rec(allIndexes, offset) {
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

}
