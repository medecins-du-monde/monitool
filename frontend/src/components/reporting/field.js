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
	'monitool.components.reporting.field',
	[
	]
);


module.directive('reportingField', function() {
	return {
		scope: false,
		link: function($scope, element, attributes, controller) {

			$scope.$watch(attributes.reportingField || 'col', function(value) {

				if (value === undefined) {
					element.html('');
					element.css('background-color', '#eee');
				}
				else if (typeof value === "string") {
					element.html('<i class="fa fa-ban" title="' + value + '"></i>');
					element.css('background-color', '');
				}
				else if (typeof value === "number" && isNaN(value)) {
					element.html('<i class="fa fa-exclamation-triangle" title="NaN"></i>');
					element.css('background-color', '');
				}
				else if (typeof value === "number") {
					// Do we use colors?
					var colorization;
					if ($scope.row && $scope.row.colorize && $scope.row.baseline !== null && $scope.row.target !== null)
						colorization = {baseline: $scope.row.baseline, target: $scope.row.target};
					else if ($scope.colorization)
						colorization = $scope.colorization;

					if (colorization) {
						var baseline = parseInt(colorization.baseline), target = parseInt(colorization.target);

						// compute progress
						var progress = Math.max(0, Math.min(1, (value - baseline) / (target - baseline)));
						element.css('background-color', 'hsl(' + progress * 120 +  ', 100%, 75%)');
					}
					else
						element.css('background-color', '');

					// should we append a symbol
					var symbol = '';
					if ($scope.row && $scope.row.unit)
						symbol = $scope.row.unit;
					else if ($scope.unit)
						symbol = $scope.unit;

					// split value by thousands
					value = Math.round(value).toString();

					var finalString;
					if (value !== 'Infinity') {
						finalString = symbol;
						while (value.length !== 0) {
							finalString = '.' + value.substr(-3) + finalString;
							value = value.substr(0, value.length - 3);
						}
						finalString = finalString.substring(1);
					}
					else
						finalString = value + symbol;

					element.html(finalString);
				}
				else {
					element.html('<i class="fa fa-interrogation" title="' + value + '"></i>');
					element.css('background-color', '');
				}
			}, true);
		}
	}
});

export default module;

