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

import uiDatepickerPopup from 'angular-ui-bootstrap/src/datepickerPopup/index';

const module = angular.module(
	'monitool.components.form.optionaldate',
	[
		uiDatepickerPopup
	]
);


module.directive('optionalDate', function() {
	return {
		restrict: 'E',
		require: 'ngModel',
		template: require('./optional-date.html'),
		scope: {
			defaultUTC: '=default'
		},
		link: function(scope, element, attributes, ngModelController) {

			ngModelController.$formatters.push(function(modelValue) {
				return modelValue ? new Date(modelValue + 'T00:00:00Z') : null;
			});

			ngModelController.$parsers.push(function(viewValue) {
				return viewValue ? viewValue.toISOString().substring(0, 10) : null;
			});

			scope.message = attributes.message;

			scope.$watch('defaultUTC', function(defaultUTC) {
				defaultUTC = new Date(defaultUTC + 'T00:00:00Z');
				scope.defaultLocal = new Date(defaultUTC.getTime() + defaultUTC.getTimezoneOffset() * 60 * 1000);
			});

			scope.container = {};

			ngModelController.$render = function() {
				var dateUTC = ngModelController.$viewValue;
				if (dateUTC) {
					scope.container.dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60 * 1000);
					scope.specifyDate = true;
				}
				else {
					scope.container.dateLocal = null;
					scope.specifyDate = false;
				}
			};

			scope.$watch('container.dateLocal', function(newDateLocal, oldDateLocal) {
				if (newDateLocal === oldDateLocal)
					return;

				if (newDateLocal)
					ngModelController.$setViewValue(new Date(newDateLocal.getTime() - newDateLocal.getTimezoneOffset() * 60 * 1000));
				else
					ngModelController.$setViewValue(null);
			});

			scope.$watch('specifyDate', function(newValue, oldValue) {
				if (oldValue === newValue)
					return;

				if (newValue) {
					var dateUTC = new Date(scope.defaultUTC + 'T00:00:00Z');
					scope.container.dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60 * 1000);
				}
				else {
					scope.container.dateLocal = null;
				}
			});
		}
	}
});

export default module;