"use strict";

angular
	.module('monitool.directives.indicatorForm', [])

	.directive('formula', function() {
		return {
			templateUrl: 'partials/indicators/edit-formula.html',
			scope: {formula: '=', id: '='},
			link: function($scope, $element, attributes, controller) {
				var parameters = {};

				$scope.delete = function() {
					$scope.$parent.deleteFormula($scope.id);
				};

				$scope.$watch('formula.expression', function(formula) {
					var newSymbols, oldSymbols = Object.keys($scope.formula.parameters).sort();
					try { newSymbols = Parser.parse($scope.formula.expression).variables().sort(); }
					catch (e) { newSymbols = []; }

					if (!angular.equals(newSymbols, oldSymbols)) {
						// Remove old symbols from formula
						oldSymbols.filter(function(s) { return newSymbols.indexOf(s) === -1; }).forEach(function(s) {
							parameters[s] = $scope.formula.parameters[s];
							delete $scope.formula.parameters[s];
						});

						// Add new symbols to formula
						newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; }).forEach(function(s) {
							$scope.formula.parameters[s] = parameters[s] || {name: "", geoAggregation: "sum", timeAggregation: "sum"};
						});
					}
				});
			}
		}
	})

	.directive('expression', function() {
		return {
			restrict: 'A',
			require: '?ngModel',
			link: function($scope, $element, attributes, controller) {
				if (!controller)
					return;


				controller.$validators.expression = function(value) {
					try {
						Parser.parse(value);
						return true
					}
					catch (e) {
						return false;
					}
				};

				controller.$validate();		
				console.log(controller)
			}
		}
	});
