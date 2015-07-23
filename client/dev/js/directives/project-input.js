"use strict";

angular.module('monitool.directives.projectInput', [])

	.directive('inputGrid', function(itertools) {
		return {
			restrict: 'E',
			scope: {
				variable: '=',
				data: '=',
				oldData: '='
			},
			templateUrl: "partials/projects/aggregated-data/_input_grid.html",

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




	// .directive('sum', function() {
	// 	return {
	// 		restrict: 'A',
	// 		scope: {
	// 			'sumType': '@',
	// 			'sumId': '=',
	// 			'sumData': '='
	// 		},
	// 		link: function($scope, element) {
	// 			$scope.$watch('sumData', function(hash) {
	// 				var sum = 0;

	// 				if ($scope.sumType === 'simple')
	// 					for (var key in $scope.sumData)
	// 						sum += $scope.sumData[key] || 0;

	// 				else if ($scope.sumType === 'deep' && $scope.sumId)
	// 					for (var key in $scope.sumData)
	// 						sum += $scope.sumData[key][$scope.sumId] || 0;

	// 				else if ($scope.sumType === 'deep')
	// 					for (var key1 in $scope.sumData)
	// 						for (var key2 in $scope.sumData[key1])
	// 							sum += $scope.sumData[key1][key2] || 0;

	// 				else
	// 					throw new Error('Invalid parameters');

	// 				element.html(sum.toString());
				
	// 			}, true)
	// 		}
	// 	}
	// })

	// /**
	//  * This directive allows coloring bullet points on the indicator input form
	//  * to tell the user if the data that is being entered is out of bounds
	//  */
	// .directive('inputStatus', function() {
	// 	return {
	// 		restrict: 'A',
	// 		link: function($scope, element) {
	// 			$scope.$watch('currentInput.values[field.model]', function() {
	// 				var planning  = $scope.project.indicators[$scope.field.indicatorId],
	// 					value     = $scope.currentInput.values[$scope.field.model];

	// 				if (planning.target === null || planning.baseline === null || value === undefined || value === null || Number.isNaN(value))
	// 					element.css('color', '');
					
	// 				else {
	// 					var progress;
	// 					if (planning.target === 'around_is_better')
	// 						progress = 100 * (1 - Math.abs(value - planning.target) / (planning.target - planning.baseline));
	// 					else
	// 						progress = 100 * (value - planning.baseline) / (planning.target - planning.baseline);

	// 					if (progress < planning.showRed)
	// 						element.css('color', 'red');
	// 					else if (progress < planning.showYellow)
	// 						element.css('color', 'orange');
	// 					else
	// 						element.css('color', 'green');
	// 				}
	// 			});
	// 		}
	// 	}
	// })

