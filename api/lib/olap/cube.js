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

function _range(n) {
	const list = new Array(n);

	for (let i = 0; i < n; ++i)
		list[i] = i;

	return list;
}

// Insertion sort. This has a terrible complexity for randomized arrays,
// but is very fast for already sorted arrays, which is what we'll be using it for
// most of the time.
function _sort(list) {
	const len = list.length;

	for (let i = 1; i < len; i++) {
		let tmp = list[i],
			j = i;
		while (list[j - 1] > tmp) {
			list[j] = list[j - 1];
			--j;
		}
		list[j] = tmp;
	}

	return list;
}

function _removeDuplicates(list) {
	const length = list.length;

	let readIndex = 1, writeIndex = 0;

	while (readIndex < length) {
		if (list[readIndex - 1] !== list[readIndex])
			list[writeIndex++] = list[readIndex - 1];
		++readIndex;
	}

	list[writeIndex++] = list[readIndex - 1];

	if (writeIndex !== length)
		list.length = writeIndex;
}

function _intersect(list, other) {
	const listLength = list.length, otherLength = other.length;

	let listWriteIndex = 0, listReadIndex = 0, otherReadIndex = 0;
	while (listReadIndex < listLength && otherReadIndex < otherLength) {
		const listItem = list[listReadIndex];
		const otherItem = other[otherReadIndex];

		if (listItem === otherItem) {
			listReadIndex++;
			otherReadIndex++;

			list[listWriteIndex++] = listItem;
		}
		else if (listItem < otherItem)
			// Item in list is not in other, let's check next item in list.
			listReadIndex++;

		else // listItem > otherItem
			// Item in other not in list, let's check next item in other.
			otherReadIndex++;
	}

	if (listLength !== listWriteIndex)
		list.length = listWriteIndex;
}


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
	 * let c = Cube.fromElement(project, project.forms[0], project.forms[0].element[0], inputs);
	 * // do stuff here
	 */
	static fromElement(project, form, element, inputs = null) {
		////////////
		// Build dimensions & groups
		////////////
		var dimensions = [], dimensionGroups = [];

		// Time
		if (inputs)
			dimensions.push(Dimension.createTimeFast(project, form, element, inputs));
		else
			dimensions.push(Dimension.createTime(project, form, element));

		['week_sat', 'week_sun', 'week_mon', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'month', 'quarter', 'semester', 'year'].forEach(periodicity => {
			// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
			try {
				dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0]));
			}
			catch (e) { }
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

		var data = new Int32Array(dataSize);
		data.fill(-123456);

		const cube = new Cube(element.id, dimensions, dimensionGroups, data);

		if (inputs)
			inputs.forEach(input => cube.fillFrom(element, input));

		// Build and fill cube
		return cube;
	}

	get dimensionsById() {
		if (!this._dimensionsById) {
			this._dimensionsById = {};
			this.dimensions.forEach(d => this._dimensionsById[d.id] = d);
		}

		return this._dimensionsById;
	}

	get dimIndexById() {
		if (!this._dimIndexById) {
			this._dimIndexById = {};
			this.dimensions.forEach((d, i) => this._dimIndexById[d.id] = i);
		}

		return this._dimIndexById;
	}

	get dimensionGroupsById() {
		if (!this._dimensionGroupsById) {
			this._dimensionGroupsById = {};
			this.dimensionGroups.forEach(d => this._dimensionGroupsById[d.id] = d);
		}

		return this._dimensionGroupsById;
	}

	/**
	 * Build a cube from it's components
	 *
	 * @param {string} id A unique identifier for this cube across the application.
	 * @param {Array.<Dimension>} dimensions The list of dimensions that this cube is using
	 * @param {Array.<DimensionGroup>} dimensionGroups The list of dimension groups that this cube is using
	 * @param {Array.<number>} data Data contained in the cube. The size of this array must be the product of the number of elements in the dimension.
	 * @param {Array.<any>} test
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
		this.test = [];
	}

	fillFrom(element, input) {
		// Compute location where this subtable should go, and length of data to copy.
		const numPartitions = element.partitions.length;

		let offset = this.dimensions[0].indexes[input.period],
			length = 1; // Slow!

		if (offset === undefined) {
			winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(did not find period in timeDim)");
			return;
		}

		offset = offset * this.dimensions[1].items.length + this.dimensions[1].indexes[input.entity];

		if (Number.isNaN(offset)) {
			winston.log('debug', "[Cube] Skip variable", element.id, 'from', input._id, "(did not find entity in spacialDim)");
			return;
		}

		for (let i = 0; i < numPartitions; ++i) {
			const numPartitionElements = element.partitions[i].elements.length;

			offset *= numPartitionElements;
			length *= numPartitionElements;
		}

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
		for (let i = 0; i < length; ++i) {
			if (source[i] !== null) {
				this.data[offset + i] = source[i];
			} else if (source[i] === null) {
				this.data[offset + 1] = -123456
			}
		}
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
		// Remove dimension groups from filters.
		filter = this._cleanFilter(filter);

		// Build keys of all levels with related filters one time.
		const levels = dimensionIds.map(dimId => {
			const rows = {};

			let dimIndex, dimension;

			// If dimension is a strait dimension.
			dimIndex = this.dimIndexById[dimId];
			if (dimIndex !== undefined) {
				dimension = this.dimensions[dimIndex];

				filter[dimIndex].forEach(index => {
					rows[dimension.items[index]] = [index];
				});
			}
			else {
				// if dimension is a group.
				const dimensionGroup = this.dimensionGroupsById[dimId];
				if (dimensionGroup) {
					dimIndex = this.dimIndexById[dimensionGroup.childDimension];
					dimension = this.dimensions[dimIndex];

					Object.keys(dimensionGroup.mapping).forEach(key => {
						const indexes = dimensionGroup.mapping[key]
							.map(item => dimension.indexes[item])
							.filter(index => filter[dimIndex].includes(index));

						if (indexes.length)
							rows[key] = indexes;
					})
				}
				else
					throw new Error('invalid dimensionId');
			}

			if (withGroups) {
				this.dimensionGroups.forEach(dimensionGroup => {
					if (dimensionGroup.childDimension === dimension.id && dimensionGroup.id !== dimId) {
						// Copy pasted ... need refactoring.
						Object.keys(dimensionGroup.mapping).forEach(key => {
							const indexes = dimensionGroup.mapping[key]
								.map(item => dimension.indexes[item])
								.filter(index => filter[dimIndex].includes(index));

							if (indexes.length)
								rows[key] = indexes;
						});
					}
				});
			}

			// with totals means that we need to provide another key.
			if (withTotals) {
				rows._total = filter[dimIndex];
			}

			// Remove filter from main array, it was merged into levels.
			filter[dimIndex] = null;

			return { dimIndex: dimIndex, rows: rows };
		});

		return this.query2(levels, 0, filter)
	}

	query2(levels, levelIndex, filters) {
		if (levelIndex == levels.length) {
			try {
				//console.log('fygiuhoi', this._query_rec(filters, 0, 0), typeof this._query_rec(filters, 0, 0))
				return this._query_rec(filters, 0, 0);
			}
			catch (e) {
				return e.message;
			}
		}

		const level = levels[levelIndex];

		const hash = {};
		Object.keys(level.rows).forEach((key, i) => {
			filters[level.dimIndex] = level.rows[key];
			const result = this.query2(levels, levelIndex + 1, filters);
			if (result !== undefined){
				hash[key] = result;
			}
		});
		filters[level.dimIndex] = null;

		console.log('-----------------------HASH---------------------------');
		console.log(hash);
		console.log(this.test);
		//['3', 3, '4', 4]
		return hash;
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
	_query_rec(indexes, indexesOffset, dataOffset) {
		// if (Number.isNaN(dataOffset))
		// 	return undefined;

		if (indexesOffset == indexes.length)
			return this.data[dataOffset] == -123456 ? undefined : this.data[dataOffset];

		const dimension = this.dimensions[indexesOffset];

		// if indexes[indexesOffset] == null => take all
		const localIndexes = indexes[indexesOffset];
		const numIndexes = localIndexes.length;

		var result, tmp, contributions = 0;
		var isNotComplete;

		// Compute dataOffset at this level.
		dataOffset *= dimension.items.length;

		// Aggregate
		switch (dimension.aggregation) {
			case 'sum':
				result = 0;
				isNotComplete = false;
				for (let i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i])
					if (tmp !== undefined) {
						++contributions;
						result += Number(tmp)
					} else {
						isNotComplete = true
					}
				}
				break;

			case 'average':
				result = 0;
				for (let i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i])
					if (tmp !== undefined) {
						++contributions;
						result += tmp
					}
				}
				result /= contributions;
				break;

			case 'highest':
				result = -Number.MAX_VALUE;
				for (let i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i]);
					if (tmp !== undefined && tmp > result) {
						++contributions;
						result = tmp;
					}
				}
				break;

			case 'lowest':
				result = Number.MAX_VALUE;
				for (let i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i])
					if (tmp !== undefined && tmp < result) {
						++contributions;
						result = tmp;
					}
				}
				break;

			case 'last':
				for (let i = numIndexes - 1; i >= 0; --i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i])
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
						break; // first defined value is OK for us.
					}
				}
				break;

			case 'none':
				for (let i = 0; i < numIndexes; ++i) {
					tmp = this._query_rec(indexes, indexesOffset + 1, dataOffset + localIndexes[i])
					if (tmp !== undefined) {
						result = tmp;
						++contributions;
					}
				}
				if (contributions > 1)
					throw new Error('AGGREGATION_FORBIDDEN');
				break;

			default:
				throw new Error('INVALID_AGGREGATION_MODE');
		}

		if (contributions == 0){			
			result = undefined;
		} else if (isNotComplete) {
			result = result.toString()
			this.test.push(result);
		}
		//console.log('HELLO', result, typeof result);
		return result;

	}

	_cleanFilter(textFilters) {
		const numDimensions = this.dimensions.length;
		const intFilters = new Array(numDimensions);

		// Convert all filters to sorted integer lists.
		for (const key in textFilters) {
			const textFilter = textFilters[key];
			const textFilterLength = textFilter.length;

			const intFilter = new Array();

			// Try converting to ints if filtering on dimension
			let dimIndex = this.dimIndexById[key];
			if (dimIndex !== undefined) {
				const dimensionIndexes = this.dimensions[dimIndex].indexes;
				for (let i = 0; i < textFilterLength; ++i) {
					const intValue = dimensionIndexes[textFilter[i]];
					if (intValue !== undefined) // skip unknown dimension items from user provided filter
						intFilter.push(intValue);
				}
			}
			else {
				// Try converting to ints if filtering on dimensionGroup
				const dimensionGroup = this.dimensionGroupsById[key];
				if (dimensionGroup) {
					for (let i = 0; i < textFilterLength; ++i) {
						const mapping = dimensionGroup.mapping[textFilter[i]];
						if (mapping) { // skip unknown group items from user provided filter
							const mappingLength = mapping.length;
							for (let j = 0; j < mappingLength; ++j)
								intFilter.push(dimension.indexes[mapping[j]]);
						}
					}

					dimIndex = this.dimIndexById[dimensionGroup.childDimension];
				}
				else
					throw new Error('Invalid filter on: ' + key);
			}

			// User filter may contain duplicates and be unsorted.
			_sort(intFilter);
			_removeDuplicates(intFilter);

			// Merge into filter.
			if (intFilters[dimIndex])
				_intersect(intFilters[dimIndex], intFilter);
			else
				intFilters[dimIndex] = intFilter;
		}

		// Fixme: this could be easily removed.
		// Add missing filters.
		for (let i = 0; i < numDimensions; ++i) {
			if (intFilters[i] === undefined)
				intFilters[i] = _range(this.dimensions[i].items.length);
		}

		return intFilters;
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

