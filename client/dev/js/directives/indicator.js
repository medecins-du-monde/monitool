"use strict";

angular
	.module('monitool.directives.indicatorForm', [])

	.directive('formula', function($rootScope) {
		return {
			templateUrl: 'partials/indicators/edit-formula.html',
			scope: {formula: '=', id: '='},
			link: function($scope, $element, attributes, controller) {
				$scope.translations = {fr: FRENCH_TRANSLATION, es: SPANISH_TRANSLATION, en: ENGLISH_TRANSLATION};
				$scope.languages = $rootScope.languages;

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
							$scope.formula.parameters[s] = parameters[s] || {fr: "", es: "", en: ""};
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
			}
		}
	})

	.directive('indicatorIcon', function() {
		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: '<i class="fa fa-fw" ng-class="iconClass" tooltip="{{translationKey|translate}}" tooltip-placement="right"></i>',
			link: function($scope, element, attributes) {
				var v = $scope.$eval(attributes.operation);
				$scope.translationKey = 'indicator.is_' + v;
				$scope.iconClass = {forbidden: 'fa-ban', optional: 'fa-question', mandatory: 'fa-asterisk'}[v];
			}
		}
	});
