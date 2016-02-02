"use strict";

angular.module('monitool.directives.projectInput', [])

	.directive('computable', function() {
		var parser = function(value) {
			try { return Parser.evaluate(value, {}); }
			catch (e) { return value; }
		};

		var validator = function(modelValue, viewValue) {
			return typeof modelValue == 'number';
		};

		var blur = function(ngModel) {
			if (typeof ngModel.$modelValue == 'number') {
				ngModel.$setViewValue(ngModel.$modelValue.toString());
				ngModel.$render();
			}
		};

		return {
			require: '?ngModel',
			scope: false,
			link: function($scope, element, attributes, ngModel) {
				ngModel.$parsers.push(parser);
				ngModel.$validators.isNumber = validator
				element.on('blur', blur.bind(null, ngModel));
			}
		};
	})
 
	.directive('inputGrid', function(itertools) {

		var computeNthPermutation = function(n, i) {
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
		}

		return {
			restrict: 'E',
			scope: {
				variable: '=',
				data: '=',
				oldData: '=',
				project: '='
			},
			templateUrl: "partials/projects/activity/_input_grid.html",

			link: function($scope, element) {
				// FIXME
				// we would like to implement something to ensure that columns do not get
				// too much crowded (by putting most stress on rows)
				// cf: partitions.slice().sort(function(a, b) { return a.length - b.length; }),
				var numPermutations = Math.factorial($scope.variable.partitions.length);

				$scope.rotation = (window.localStorage['input.rotation.' + $scope.variable.id] % numPermutations) || 0;

				$scope.rotate = function(offset) {
					$scope.rotation
						= window.localStorage['input.rotation.' + $scope.variable.id]
						= ((($scope.rotation + offset) % numPermutations) + numPermutations) % numPermutations;

					createTable();
				};
				
				var createTable = function() {
					// Split partitions in cols and rows.
					var numPartitions = $scope.variable.partitions.length,
						partitions = computeNthPermutation(numPartitions, $scope.rotation).map(function(i) { return $scope.variable.partitions[i]; });

					if (partitions.length > 0) {
						var cols = partitions.slice(0, partitions.length / 2),
							rows = partitions.slice(partitions.length / 2);
						
						// Create empty grid.
						var grid = {header: [], body: []};
						
						// Create header rows.
						var totalCols = cols.reduce(function(memo, item) { return memo * item.length; }, 1),
							colspan = totalCols, // current colspan is total number of columns.
							numCols = 1; // current numcols is 1.

						for (var i = 0; i < cols.length; ++i) {
							// adapt colspan and number of columns
							colspan /= cols[i].length; 
							numCols *= cols[i].length;

							// Create header row
							var row = {colspan: colspan, cols: []};
							for (var k = 0; k < numCols; ++k)
								row.cols.push(cols[i][k % cols[i].length]);

							grid.header.push(row);
						}

						// Create data rows.
						$scope.rowspans = [];
						var rowspan = rows.reduce(function(memo, item) { return memo * item.length; }, 1);
						for (var i = 0; i < rows.length; ++i) {
							rowspan /= rows[i].length;
							$scope.rowspans[i] = rowspan;
						}

						itertools.product(rows).forEach(function(headers) {
							grid.body.push({
								headerCols: headers,
								dataCols: itertools.product(headers.map(function(a) {return[a]}).concat(cols)).map(function(els) {
									return els.map(function(el) { return el.id}).sort().join('.');
								})
							});
						});

						$scope.grid = grid;
					}
				};

				createTable();
			}
		}
	})

