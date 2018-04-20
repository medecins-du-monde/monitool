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

"use strict";

angular
	.module('monitool.services.utils.itertools', [])

	/**
	 * This service contains generic helpers to manipulate arrays and tables that
	 * are used all across the project (mostly for directives).
	 */
	.service('itertools', function() {

		/**
		 * Compute the product of two arrays.
		 *
		 * @example
		 * var arr;
		 *
		 * arr = product([1], [2, 3])
		 * // arr = [[1, 2], [1, 3]]
		 */
		var productSingle = function(a, b) {
			var result = [], lengthA = a.length, lengthB = b.length;
			var k = 0;

			for (var i = 0; i < lengthA; ++i)
				for (var j = 0; j < lengthB; ++j)
					result[k++] = a[i].concat([b[j]]);
			
			return result;
		};
		
		/**
		 * Compute a range. End value is not included.
		 *
		 * @example
		 * var arr;
		 * 
		 * arr = range(10, 20)
		 * // arr == [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
		 */
		this.range = function(start, end) {
			var integerRange = [];
			for (var i = start; i < end; ++i)
				integerRange.push(i);
			return integerRange;
		};

		/**
		 * Compute the product of multiple arrays.
		 *
		 * @example
		 * var arr;
		 * 
		 * arr = product([[1, 2], [3, 4]])
		 * // arr == [[1, 3], [1, 4], [2, 3], [2, 4]]
		 * 
		 * arr = product([[1], [3, 4, 5]])
		 * // arr == [[1, 3], [1, 4], [1, 5]]
		 */
		this.product = function(list) {
			if (list.length == 0)
				return [];

			var memo = list[0].map(function(el) { return [el]; });
			for (var i = 1; i < list.length; ++i)
				memo = productSingle(memo, list[i]);
			
			return memo;
		};

		/**
		 * Compute of the n-th permutation of sequence range(i).
		 *
		 * @example
		 * var arr;
		 * 
		 * arr = computeNthPermutation(10, 0);
		 * // arr == [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		 * 
		 * arr = computeNthPermutation(10, 1);
		 * // arr == [0, 1, 2, 3, 4, 5, 6, 7, 9, 8]
		 * 
		 * arr = computeNthPermutation(10, Math.factorial(10) - 1);
		 * // arr == [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
		 */
		this.computeNthPermutation = function(n, i) {
			var j, k = 0,
				fact = [],
				perm = [];

			// compute factorial numbers
			fact[k] = 1;
			while (++k < n)
				fact[k] = fact[k - 1] * k;

			// compute factorial code
			for (k = 0; k < n; ++k) {
				perm[k] = i / fact[n - 1 - k] << 0;
				i = i % fact[n - 1 - k];
			}

			// readjust values to obtain the permutation
			// start from the end and check if preceding values are lower
			for (k = n - 1; k > 0; --k)
				for (j = k - 1; j >= 0; --j)
					if (perm[j] <= perm[k])
						perm[k]++;

			return perm;
		};

		/**
		 * Do the opposite of computeNthPermutation
		 * 
		 * @fixme
		 * Bruteforcing this instead of doing proper math is O(scary)
		 * 
		 * It *should* be fast enough in practice as we have never seen more than 5 disaggregations on a variable (5! = 120 permutations)
		 * Will be slow with 6, most likely broken with 7.
		 * 
		 * @example
		 * computePermutationIndex([0, 1, 2]) == 0;
		 * computePermutationIndex([0, 2, 1]) == 1;
 		 * computePermutationIndex([0, 1, 3]) => error;
		 */
		this.computePermutationIndex = function(arr) {
			var numPermutations = Math.factorial(arr.length);

			for (var permutationId = 0; permutationId < numPermutations; ++permutationId) {
				var permutation = this.computeNthPermutation(arr.length, permutationId);

				// compare array
				for (var i = 0; i < arr.length; ++i)
					if (permutation[i] !== arr[i])
						break;

				// we have a match
				if (i == arr.length)
					return permutationId;
			}

			throw new Exception('Permutation was not found. Should not happen.');
		};

		/**
		 * Transpose a 2D array.
		 * 
		 * @example
		 * var arr = [
		 * 		[{colSpan: 2}, {colSpan: 1}],
		 * ];
		 *
		 * transpose2D(arr) == [
		 * 		[{rowSpan: 2}],
		 * 		[{rowSpan: 1}],
		 * ];
		 */
		this.transpose2D = function(rows) {
			if (rows.length === 0)
				return [];

			var result = new Array(rows[0].length);

			for (var x = 0; x < rows[0].length; ++x) {
				result[x] = new Array(rows.length);

				for (var y = 0; y < rows.length; ++y) {
					result[x][y] = angular.copy(rows[y][x]);

					if (result[x][y].colSpan) {
						result[x][y].rowSpan = result[x][y].colSpan;
						delete result[x][y].colSpan;
					}
					else if (result[x][y].rowSpan) {
						result[x][y].colSpan = result[x][y].rowSpan;
						delete result[x][y].rowSpan;
					}
				}
			}

			return result;
		};

		/**
		 * Test two array, to see if one is a subset of the other.
		 *
		 * @example
		 * isSubset([1, 2, 3], [3, 1]) == true
		 * isSubset([1, 2, 3], [4, 1]) == false
		 */
		this.isSubset = function(superset, subset) {
			return this.intersect(subset, superset).length === subset.length;
		};

		/**
		 * Intersect two arrays.
		 *
		 * @example
		 * intersect([1, 2, 3], [3, 1]) == [1, 3]
		 * intersect([1, 2, 3], [4, 1]) == [1]
		 */
		this.intersect = function(array1, array2) {
			return array1.filter(function(el) {
				return array2.indexOf(el) !== -1;
			});
		};

	})

	.factory('projectCompare', function() {
		var hashFunction = function(obj) {
			if (typeof obj === 'string')
				return obj;
			else
				return obj.id || obj.username || obj.display || obj.name;
		};

		/**
		 * Compare two arrays of objects, and create remove, add and move operations
		 * to patch from the first to the second.
		 */
		var compareArray = function(before, after, changes, prefix) {
			var beforeIds = before.map(hashFunction), afterIds = after.map(hashFunction);

			// start by removing items
			for (var beforeIndex = 0; beforeIndex < beforeIds.length; ++beforeIndex) {
				var id = beforeIds[beforeIndex], afterIndex = afterIds.indexOf(id);

				if (afterIndex === -1) {
					// element was removed
					beforeIds.splice(beforeIndex, 1);
					before.splice(beforeIndex, 1);
					changes.push({op: 'remove', path: prefix + beforeIndex});
					beforeIndex--; // we need to recheck the same place in the table.
				}
			}

			// add missing items at the end
			for (var afterIndex = 0; afterIndex < afterIds.length; ++afterIndex) {
				var id = afterIds[afterIndex], beforeIndex = beforeIds.indexOf(id);

				if (beforeIndex === -1) {
					// element was added
					beforeIds.push(id);
					before.push(after[afterIndex]);
					changes.push({op: 'add', path: prefix + beforeIds.length, value: after[afterIndex]});
				}
			}

			// reorder items
			for (var afterIndex = 0; afterIndex < afterIds.length; ++afterIndex) {
				var id = afterIds[afterIndex], beforeIndex = beforeIds.indexOf(id);

				if (afterIndex !== beforeIndex) {
					// vire l'item de before
					var item = before.splice(beforeIndex, 1)[0];
					beforeIds.splice(beforeIndex, 1);

					// le remet au bon endroit
					before.splice(afterIndex, 0, item);
					beforeIds.splice(afterIndex, 0, id);
					changes.push({op: 'move', from: prefix + beforeIndex, path: prefix + afterIndex})
				}
			}
		};

		// We can't use jsonpatch.compare to generate human readable patches
		// because it's not smart enougth to see when element moved
		return function(before, after) {
			before = JSON.parse(angular.toJson(before)); // clone

			var changes = [];

			// Entities
			compareArray(before.entities, after.entities, changes, '/entities/');
			compareArray(before.themes, after.themes, changes, '/themes/');

			// Groups
			compareArray(before.groups, after.groups, changes, '/groups/');
			for (var groupIndex = 0; groupIndex < before.groups.length; ++groupIndex)
				compareArray(
					before.groups[groupIndex].members,
					after.groups[groupIndex].members,
					changes,
					/groups/ + groupIndex + '/members/'
				);

			// Forms
			compareArray(before.forms, after.forms, changes, '/forms/');
			for (var formIndex = 0; formIndex < before.forms.length; ++formIndex) {
				compareArray(
					before.forms[formIndex].entities,
					after.forms[formIndex].entities,
					changes,
					'/forms/' + formIndex + '/entities/'
				);

				compareArray(
					before.forms[formIndex].elements,
					after.forms[formIndex].elements,
					changes,
					'/forms/' + formIndex + '/elements/'
				);

				for (var elementIndex = 0; elementIndex < before.forms[formIndex].elements.length; ++elementIndex) {
					compareArray(
						before.forms[formIndex].elements[elementIndex].partitions,
						after.forms[formIndex].elements[elementIndex].partitions,
						changes,
						'/forms/' + formIndex + '/elements/' + elementIndex + '/partitions/'
					);

					for (var partitionIndex = 0; partitionIndex < before.forms[formIndex].elements[elementIndex].partitions.length; ++partitionIndex) {
						compareArray(
							before.forms[formIndex].elements[elementIndex].partitions[partitionIndex].elements,
							after.forms[formIndex].elements[elementIndex].partitions[partitionIndex].elements,
							changes,
							'/forms/' + formIndex + '/elements/' + elementIndex + '/partitions/' + partitionIndex + '/elements/'
						);

						compareArray(
							before.forms[formIndex].elements[elementIndex].partitions[partitionIndex].groups,
							after.forms[formIndex].elements[elementIndex].partitions[partitionIndex].groups,
							changes,
							'/forms/' + formIndex + '/elements/' + elementIndex + '/partitions/' + partitionIndex + '/groups/'
						);

						for (var pGroupIndex = 0; pGroupIndex < before.forms[formIndex].elements[elementIndex].partitions[partitionIndex].groups.length; ++pGroupIndex) {
							compareArray(
								before.forms[formIndex].elements[elementIndex].partitions[partitionIndex].groups[pGroupIndex].members,
								after.forms[formIndex].elements[elementIndex].partitions[partitionIndex].groups[pGroupIndex].members,
								changes,
								'/forms/' + formIndex + '/elements/' + elementIndex + '/partitions/' + partitionIndex + '/groups/' + pGroupIndex + '/members/'
							);
						}
					}
				}
			}

			compareArray(before.logicalFrames, after.logicalFrames, changes, '/logicalFrames/');
			for (var logFrameId = 0; logFrameId < before.logicalFrames.length; ++logFrameId) {
				compareArray(
					before.logicalFrames[logFrameId].indicators,
					after.logicalFrames[logFrameId].indicators,
					changes,
					'/logicalFrames/' + logFrameId + '/indicators/'
				);

				for (var purposeId = 0; purposeId < before.logicalFrames[logFrameId].purposes.length; ++purposeId) {
					compareArray(
						before.logicalFrames[logFrameId].purposes[purposeId].indicators,
						after.logicalFrames[logFrameId].purposes[purposeId].indicators,
						changes,
						'/logicalFrames/' + logFrameId + '/purposes/' + purposeId + '/indicators/'
					);

					for (var outputId = 0; outputId < before.logicalFrames[logFrameId].purposes[purposeId].outputs.length; ++outputId) {
						compareArray(
							before.logicalFrames[logFrameId].purposes[purposeId].outputs[outputId].indicators,
							after.logicalFrames[logFrameId].purposes[purposeId].outputs[outputId].indicators,
							changes,
							'/logicalFrames/' + logFrameId + '/purposes/' + purposeId + '/outputs/' + outputId + '/indicators/'
						);
					}
				}
			}

			compareArray(before.extraIndicators, after.extraIndicators, changes, '/extraIndicators/');

			// Users
			compareArray(before.users, after.users, changes, '/users/');
			for (var userIndex = 0; userIndex < before.users.length; ++userIndex) {
				if (before.users[userIndex].role == 'input' && after.users[userIndex].role == 'input') {
					compareArray(
						before.users[userIndex].entities,
						after.users[userIndex].entities,
						changes,
						/users/ + userIndex + '/entities/'
					);

					compareArray(
						before.users[userIndex].dataSources,
						after.users[userIndex].dataSources,
						changes,
						/users/ + userIndex + '/dataSources/'
					);
				}
			}



			return changes.concat(jsonpatch.compare(before, after));
		};
	});

