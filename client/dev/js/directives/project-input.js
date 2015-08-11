"use strict";

angular.module('monitool.directives.projectInput', [])

	.directive('inputGrid', function(itertools) {
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

				// Split partitions in cols and rows.
				var partitions = $scope.variable.partitions,
					cols = partitions.slice(0, partitions.length / 2),
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
		}
	})

