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
	'monitool.directives.validators.max',
	[]
);

const isEmpty = function(value) {
	return angular.isUndefined(value) || value === '' || value === null || value !== value;
};

module.directive('ngMax', function() {
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
});


export default module;
