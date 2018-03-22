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

"use strict";

function isEmpty(value) {
	return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

angular.module('monitool.directives.formValidators', [])

	.directive('forbiddenValues', function() {
		return {
			restrict: "A",
			require: 'ngModel',
			link: function($scope, element, attributes, ngModelController) {
				ngModelController.$validators.forbiddenValues = function(modelValue, viewValue) {
					var values = $scope.$eval(attributes.forbiddenValues);
					return values.indexOf(viewValue) === -1;
				};
			}
		};
	})

	.directive('uiRequired', function() {
		return {
			restrict: "A",
			require: 'ngModel',
			link: function(scope, elm, attrs, ctrl) {
				ctrl.$validators.required = function(modelValue, viewValue) {
					return !((viewValue && viewValue.length === 0 || false) && attrs.uiRequired === 'true');
				};

				attrs.$observe('uiRequired', function() {
					ctrl.$setValidity('required', !(attrs.uiRequired === 'true' && ctrl.$viewValue && ctrl.$viewValue.length === 0));
				});
			}
		};
	})

	.directive('ngMin', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, elem, attributes, controller) {
				$scope.$watch(attributes.ngMin, function(){
					controller.$setViewValue(controller.$viewValue);
				});

				var minValidator = function(value) {
					var min = $scope.$eval(attributes.ngMin) || 0;
					if (!isEmpty(value) && value < min) {
						controller.$setValidity('ngMin', false);
						return undefined;
					}
					else {
						controller.$setValidity('ngMin', true);
						return value;
					}
				};

				controller.$parsers.push(minValidator);
				controller.$formatters.push(minValidator);
			}
		};
	})

	.directive('ngMax', function() {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function($scope, elem, attributes, controller) {
				$scope.$watch(attributes.ngMax, function(){
					controller.$setViewValue(controller.$viewValue);
				});

				var maxValidator = function(value) {
					var max = $scope.$eval(attributes.ngMax) || Infinity;
					if (!isEmpty(value) && value > max) {
						controller.$setValidity('ngMax', false);
						return undefined;
					}
					else {
						controller.$setValidity('ngMax', true);
						return value;
					}
				};

				controller.$parsers.push(maxValidator);
				controller.$formatters.push(maxValidator);
			}
		};
	})

	.directive('expression', function(Parser) {
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
