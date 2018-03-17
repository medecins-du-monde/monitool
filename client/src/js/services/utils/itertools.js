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

	});

