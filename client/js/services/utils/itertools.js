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
	.service('itertools', function() {

		var productSingle = function(a, b) {
			var result = [], lengthA = a.length, lengthB = b.length;
			var k = 0;

			for (var i = 0; i < lengthA; ++i)
				for (var j = 0; j < lengthB; ++j)
					result[k++] = a[i].concat([b[j]]);
			
			return result;
		};
		
		this.range = function(start, end) {
			var integerRange = [];
			for (var i = start; i < end; ++i)
				integerRange.push(i);
			return integerRange;
		};

		/**
		 * Return the product of two or more arrays.
		 * in:  [[1,2],[3,4]]
		 * out: [[1,3],[1,4],[2,3],[2,4]]
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
		 * Compute of the n-th permutation of sequence range(i)
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

		this.isSubset = function(superset, subset) {
			return this.intersect(subset, superset).length === subset.length;
		};

		this.intersect = function(array1, array2) {
			return array1.filter(function(el) {
				return array2.indexOf(el) !== -1;
			});
		};

	});

