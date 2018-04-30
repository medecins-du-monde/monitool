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

const module = angular.module(
	'monitool.components.form.optionalnumber',
	[
	]
);


module.directive('optionalNumber', function() {
	return {
		restrict: 'E',
		require: 'ngModel',
		template: require('./optional-number.html'),
		scope: {
			default: '=default'
		},
		link: function(scope, element, attributes, ngModelController) {
			scope.message = attributes.message;
			scope.container = {};

			ngModelController.$render = function() {
				var numberValue = ngModelController.$viewValue;
				if (numberValue !== null) {
					scope.specifyValue = true;
					scope.container.chosenValue = numberValue;
				}
				else {
					scope.specifyValue = false;
					scope.container.chosenValue = null;
				}
			};

			scope.$watch('container.chosenValue', function(newValue, oldValue) {
				if (newValue === oldValue)
					return;

				ngModelController.$setViewValue(newValue);
			});

			scope.$watch('specifyValue', function(newSpecifyValue, oldSpecifyValue) {
				if (newSpecifyValue === oldSpecifyValue)
					return;

				if (newSpecifyValue)
					scope.container.chosenValue = scope.default;
				else
					scope.container.chosenValue = null;
			});

		}
	}
});


export default module;
