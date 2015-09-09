"use strict";

angular
	.module(
		'monitool.directives.indicatorForm',
		[
			'monitool.services.translate',
		]
	)

	.directive('formula', function($rootScope, googleTranslation) {
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

				$scope.translate = function(key, destLanguage, sourceLanguage) {
					googleTranslation.translate($scope.formula.parameters[key][sourceLanguage], destLanguage, sourceLanguage).then(function(result) {
						$scope.formula.parameters[key][destLanguage] = result;
					});
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

	.directive('indicatorOperation', function() {
		return {
			restrict: 'E',
			replace: true,
			scope: true,
			template: '<i class="fa fa-fw" ng-class="operationClass" tooltip="{{operationTranslation|translate}}" tooltip-placement="right" ></i>',
			link: function($scope, element, attributes) {
				var indicator = $scope.$eval(attributes.indicator);
				$scope.operationClass = {forbidden: 'fa-ban text-danger', approved: 'fa-check text-success', waiting: 'fa-clock-o text-warning', mandatory: 'fa-asterisk text-success'}[indicator.operation];
				$scope.operationTranslation = 'indicator.is_' + indicator.operation;
			}
		}
	})


