"use strict";

angular.module('monitool.directives.projectInput', [])

	.directive('sum', function() {
		return {
			restrict: 'A',
			scope: {
				'sumType': '@',
				'sumId': '=',
				'sumData': '='
			},
			link: function($scope, element) {
				$scope.$watch('sumData', function(hash) {
					var sum = 0;

					if ($scope.sumType === 'simple') {
						for (var key in $scope.sumData) {
							if (key !== 'sum') {
								sum += $scope.sumData[key] || 0;
							}
						}
					}
					else if ($scope.sumType === 'deep' && $scope.sumId) {
						for (var key in $scope.sumData) {
							if (key !== 'sum') {
								sum += $scope.sumData[key][$scope.sumId] || 0;
							}
						}
					}
					else if ($scope.sumType === 'deep') {
						for (var key1 in $scope.sumData) {
							for (var key2 in $scope.sumData[key1]) {
								if (key1 !== 'sum' && key2 !== 'sum') {
									sum += $scope.sumData[key1][key2] || 0;
								}
							}
						}
					}
					else
						throw new Error('Invalid parameters');

					element.html(sum.toString());
				
				}, true)
			}
		}
	})

	/**
	 * This directive allows coloring bullet points on the indicator input form
	 * to tell the user if the data that is being entered is out of bounds
	 */
	.directive('inputStatus', function() {
		return {
			restrict: 'A',
			link: function($scope, element) {
				$scope.$watch('currentInput.values[field.model]', function() {
					var planning  = $scope.project.indicators[$scope.field.indicatorId],
						value     = $scope.currentInput.values[$scope.field.model];

					if (planning.target === null || planning.baseline === null || value === undefined || value === null || Number.isNaN(value))
						element.css('color', '');
					
					else {
						var progress;
						if (planning.target === 'around_is_better')
							progress = 100 * (1 - Math.abs(value - planning.target) / (planning.target - planning.baseline));
						else
							progress = 100 * (value - planning.baseline) / (planning.target - planning.baseline);

						if (progress < planning.showRed)
							element.css('color', 'red');
						else if (progress < planning.showYellow)
							element.css('color', 'orange');
						else
							element.css('color', 'green');
					}
				});
			}
		}
	})

