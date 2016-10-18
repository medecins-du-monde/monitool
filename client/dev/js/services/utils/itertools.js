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

	});
