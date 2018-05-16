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
	'monitool.components.ng-models.partition-filter',
	[
	]
);


module.directive('partitionFilter', function() {

	return {
		restrict: 'E',
		require: "ngModel",
		scope: { element: '=' },
		template: require('./partition-filter.html'),

		link: function(scope, element, attributes, ngModelController) {

			scope.$watch('element', function(element, oldElement) {
				if (element === undefined || element === null)
					scope.filter = {};

				else if (element !== oldElement) {
					scope.filter = {};

					element.partitions.forEach(partition => {
						scope.filter[partition.id] = partition.elements.map(e => e.id);
					});
				}
			});

			ngModelController.$parsers.push(function(viewValue) {
				var modelValue = {};

				if (scope.element)
					scope.element.partitions.forEach(partition => {
						if (viewValue[partition.id].length !== partition.elements.length)
							modelValue[partition.id] = viewValue[partition.id];
					});

				return modelValue;
			});

			ngModelController.$formatters.push(function(modelValue) {
				var viewValue = {};

				if (scope.element)
					scope.element.partitions.forEach(partition => {
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