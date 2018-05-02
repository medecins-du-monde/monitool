/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import angular from 'angular';
import exprEval from 'expr-eval';

import uiModal from 'angular-ui-bootstrap/src/modal/index';

import mtComponentsOptionalNumber from '../form/optional-number';

const module = angular.module(
	'monitool.components.indicator.editionmodal',
	[
		uiModal, // for $uibModal

		mtComponentsOptionalNumber.name
	]
);


module.controller('ProjectIndicatorEditionModalController', function($scope, $uibModalInstance, planning, indicator) {
	$scope.indicator = indicator;
	$scope.planning = planning ? angular.copy(planning) : {
		display: '',
		colorize: true,
		baseline: null,
		target: null,
		computation: {
			formula: "copied_value",
			parameters: {
				copied_value: {
					elementId: null,
					filter: {}
				}
			}
		}
	};

	if ($scope.indicator)
		delete $scope.planning.display;

	$scope.masterPlanning = angular.copy($scope.planning);
	$scope.isUnchanged = function() {
		return angular.equals($scope.planning, $scope.masterPlanning);
	};

	$scope.reset = function() {
		angular.copy($scope.masterPlanning, $scope.planning);
	};

	$scope.isNew = !planning;

	$scope.save   = function() { $uibModalInstance.close($scope.planning); };
	$scope.delete = function() { $uibModalInstance.close(null); };
	$scope.cancel = function() { $uibModalInstance.dismiss(); };
});


module.directive('indicatorComputation', function() {

	var PERCENTAGE_FORMULA = '100 * numerator / denominator',
		PERMILLE_FORMULA   = '1000 * numerator / denominator',
		COPY_FORMULA       = 'copied_value';

	return {
		restrict: 'E',
		require: 'ngModel',
		template: require('./edition-modal-computation.html'),
		scope: {
			forms: '='
		},
		link: function(scope, element, attributes, ngModelController) {
			scope.selectElements = [];
			scope.elementsById = {};
			scope.forms.forEach(function(form) {
				form.elements.forEach(function(element) {
					scope.elementsById[element.id] = element; // Use to find partition on view
					scope.selectElements.push({id: element.id, name: element.name, group: form.name}); // Used by selectbox
				});
			});

			scope.symbols = [];

			// The watch will be set by the render function to be sure the value is initialiazed
			var formulaWatch;

			var onFormulaChange = function(formula) {
				// Create and remove items in computation.parameters hash, when the formula changes.
				var newSymbols, oldSymbols = Object.keys(scope.computation.parameters);
				try { newSymbols = exprEval.Parser.parse(scope.computation.formula).variables(); }
				catch (e) { newSymbols = []; }

				if (!angular.equals(newSymbols, oldSymbols)) {
					var addedSymbols = newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; });

					// Add new symbols to formula
					addedSymbols.forEach(function(s) {
						scope.computation.parameters[s] = {elementId: null, filter: {}};
					});
				}

				scope.symbols = newSymbols;
			};

			ngModelController.$render = function() {
				scope.computation = ngModelController.$viewValue;

				// we set the watch once the model is passed to the directive.
				if (!formulaWatch)
					formulaWatch = scope.$watch('computation.formula', onFormulaChange);
			};

			ngModelController.$parsers.push(function(viewValue) {
				if (scope.computation.type === 'unavailable')
					return null;

				else if (scope.computation.type === 'fixed')
					return {formula: scope.computation.formula, parameters: {}};

				else
					return {formula: scope.computation.formula, parameters: scope.computation.parameters};
			});

			ngModelController.$formatters.push(function(modelValue) {
				// Guess formula type with the content.
				if (modelValue === null)
					return {type: 'unavailable', formula: '', parameters: {}};

				else if (!isNaN(modelValue.formula))
					return {type: 'fixed', formula: modelValue.formula, parameters: {}};

				else if (modelValue.formula === COPY_FORMULA)
					return {type: 'copy', formula: COPY_FORMULA, parameters: modelValue.parameters};

				else if (modelValue.formula === PERCENTAGE_FORMULA)
					return {type: 'percentage', formula: PERCENTAGE_FORMULA, parameters: modelValue.parameters};

				else if (modelValue.formula === PERMILLE_FORMULA)
					return {type: 'permille', formula: PERMILLE_FORMULA, parameters: modelValue.parameters};

				else
					return {type: 'formula', formula: modelValue.formula, parameters: modelValue.parameters};
			});

			scope.$watch('computation', function() {
				ngModelController.$setViewValue(angular.copy(scope.computation));
			}, true);

			// when computation type is manually changed, update the formula.
			scope.$watch('computation.type', function() {
				// change fixed formula only if it is needed.
				if (scope.computation.type === 'fixed' && isNaN(scope.computation.formula))
					scope.computation.formula = '0';

				else if (scope.computation.type === 'copy')
					scope.computation.formula = COPY_FORMULA;

				else if (scope.computation.type === 'percentage')
					scope.computation.formula = PERCENTAGE_FORMULA;

				else if (scope.computation.type === 'permille')
					scope.computation.formula = PERMILLE_FORMULA;
			});
		}
	};
});


module.directive('partitionsFilter', function() {

	return {
		restrict: 'E',
		require: "ngModel",
		scope: { element: '=' },
		template: require('./edition-modal-partitions.html'),

		link: function(scope, element, attributes, ngModelController) {

			scope.$watch('element', function(element, oldElement) {
				if (element === undefined || element === null)
					scope.filter = {};

				else if (element !== oldElement) {
					scope.filter = {};

					element.partitions.forEach(function(partition) {
						scope.filter[partition.id] = partition.elements.map(e => e.id);
					});
				}
			});

			ngModelController.$parsers.push(function(viewValue) {
				var modelValue = {};

				if (scope.element)
					scope.element.partitions.forEach(function(partition) {
						if (viewValue[partition.id].length !== partition.elements.length)
							modelValue[partition.id] = viewValue[partition.id];
					});

				return modelValue;
			});

			ngModelController.$formatters.push(function(modelValue) {
				var viewValue = {};

				if (scope.element)
					scope.element.partitions.forEach(function(partition) {
						if (modelValue[partition.id])
							viewValue[partition.id] = modelValue[partition.id];
						else
							viewValue[partition.id] = partition.elements.map(e => e.id);
					});

				return viewValue;
			});

			ngModelController.$render = function() {
				scope.filter = ngModelController.$viewValue;
			};

			scope.$watch('filter', function() {
				ngModelController.$setViewValue(angular.copy(scope.filter));
			}, true)
		}
	}
});


export default module;
