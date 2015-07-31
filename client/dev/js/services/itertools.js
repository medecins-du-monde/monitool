"use strict";

angular.module('monitool.services.itertools', [])
	
	.factory('itertools', function() {

		return {


			/**
			 * Return the product of two or more arrays.
			 * in:  [[1,2],[3,4]]
			 * out: [[1,3],[1,4],[2,3],[2,4]]
			 */
			product: function(list) {
				var productSingle = function(a, b) {
					var result = [], lengthA = a.length, lengthB = b.length;
					var k = 0;

					for (var i = 0; i < lengthA; ++i)
						for (var j = 0; j < lengthB; ++j)
							result[k++] = a[i].concat([b[j]]);
					
					return result;
				};

				if (list.length == 0)
					return [];

				var memo = list[0].map(function(el) { return [el]; });
				for (var i = 1; i < list.length; ++i)
					memo = productSingle(memo, list[i]);
				
				return memo;
			},

		}
	});
