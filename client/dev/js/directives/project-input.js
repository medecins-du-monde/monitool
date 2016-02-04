"use strict";

angular.module('monitool.directives.projectInput', [])

	.directive('inputGrid', function(itertools, $rootScope) {

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

		

		var headerOptions = {
				readOnly: true,
				renderer: function(instance, td, row, col, prop, value, cellProperties) {
					Handsontable.renderers.TextRenderer.apply(this, arguments);
					td.style.color = 'black';
				    td.style.background = '#eee';
				}
			},
			dataOptions = {type: 'numeric'};

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
				if ($rootScope.userCtx.roles.indexOf("_admin") === -1 && $scope.project.dataEntryOperators.indexOf($rootScope.userCtx._id) === -1)
					var dataOptions = {type: 'numeric', readOnly: true};

				// Compute the number of possible permutation of partitions, and retrieve or init current rotation.
				$scope.numPermutations = Math.factorial($scope.variable.partitions.length);
				$scope.rotation = (window.localStorage['input.rotation.' + $scope.variable.id] % $scope.numPermutations) || 0;
				
				var createTable = function() {
					// Split partitions in cols and rows.
					var numPartitions = $scope.variable.partitions.length,
						partitions = computeNthPermutation(numPartitions, $scope.rotation).map(function(i) { return $scope.variable.partitions[i]; });

					var topPartitions  = partitions.slice(0, partitions.length / 2),
						leftPartitions = partitions.slice(partitions.length / 2);

					var totalCols = topPartitions.reduce(function(memo, item) { return memo * item.length; }, 1),
						totalRows = leftPartitions.reduce(function(memo, item) { return memo * item.length; }, 1),
						colspan = totalCols, // current colspan is total number of columns.
						numCols = 1;

					$scope.settings = {
						stretchH: "all",
						// mergeCells: [],
						colWidths: 'xxx',  // i have no idea why, but this keeps all columns to the same width
						maxCols: totalCols + leftPartitions.length,
						maxRows: totalRows + topPartitions.length,
						cells: function(row, col, prop) {
							return row < topPartitions.length || col < leftPartitions.length ? headerOptions : dataOptions;
						}
					};

					$scope.tableRows = []

					if (partitions.length > 0) {
						topPartitions.forEach(function(topPartition, topPartitionIndex) {
							// Adapt colspan and number of columns
							colspan /= topPartition.length; 
							numCols *= topPartition.length;

							var i, row = [];

							// push empty cells to fit the line headers
							for (i = 0; i < leftPartitions.length; ++i)
								row.push('');

							// push headers from the partition
							for (var k = 0; k < numCols; ++k) {
								// $scope.settings.mergeCells.push({row: topPartitionIndex, col: leftPartitions.length + k * colspan, colspan: colspan});

								row.push(topPartition[k % topPartition.length].name);
								for (i = 0; i < colspan - 1; ++i)
									row.push('');
							}

							$scope.tableRows.push(row);
						});

						// Create data rows.
						var rowspans = [];
						var rowspan = totalRows;
						for (var i = 0; i < leftPartitions.length; ++i) {
							rowspan /= leftPartitions[i].length;
							rowspans[i] = rowspan;
						}

						itertools.product(leftPartitions).forEach(function(headers, index) {
							// Init row with the labels on the left.
							var row = [];

							headers.forEach(function(header, index2) {
								row.push(index % rowspans[index2] == 0 ? header.name : '');
							});
					
							// build ids for each field in the row
							var fieldIds = itertools.product(headers.map(function(a) {return[a]}).concat(topPartitions)).map(function(els) {
								return els.map(function(el) { return el.id}).sort().join('.');
							});

							row = row.concat(fieldIds.map(function(id) { return $scope.data[$scope.variable.id + '.' + id] || 0;}));

							$scope.tableRows.push(row);
						});
					}
					else {
						$scope.tableRows.push([$scope.data[$scope.variable.id] || 0]);
					}
				};

				var rotate = function(offset) {
					$scope.rotation
						= window.localStorage['input.rotation.' + $scope.variable.id]
						= ((($scope.rotation + offset) % $scope.numPermutations) + $scope.numPermutations) % $scope.numPermutations;

					createTable();
				}

				var updateData = function(newValue, oldValue) {
					if (!newValue)
						return;

					var numPartitions = $scope.variable.partitions.length,
						partitions = computeNthPermutation(numPartitions, $scope.rotation).map(function(i) { return $scope.variable.partitions[i]; });

					var topPartitions  = partitions.slice(0, partitions.length / 2),
						leftPartitions = partitions.slice(partitions.length / 2);

					for (var y = topPartitions.length; y < $scope.tableRows.length; ++y)
						for (var x = leftPartitions.length; x < $scope.tableRows[y].length; ++x) {
							if (typeof $scope.tableRows[y][x] == 'string')
								try { $scope.tableRows[y][x] = Parser.evaluate($scope.tableRows[y][x], {}); }
								catch (e) {}
							}

					// we need to tell handsontable to update in some way.
					if (numPartitions > 0) {
						itertools.product(leftPartitions).forEach(function(headers, row) {
							// build ids for each field in the row
							var fieldIds = itertools.product(headers.map(function(a) {return[a]}).concat(topPartitions)).map(function(els) {
								return els.map(function(el) { return el.id}).sort().join('.');
							}).forEach(function(fieldId, col) {
								var value = $scope.tableRows[row + topPartitions.length][col + leftPartitions.length];
								$scope.data[$scope.variable.id + '.' + fieldId] = typeof value == 'number' ? value : 0;
							});
						});
					}
					else {
						$scope.data[$scope.variable.id] = $scope.tableRows[0][0];
					}
				};

				createTable();
				$scope.$watch('tableRows', updateData, true);
				$scope.rotate = rotate;
			}
		}
	})

