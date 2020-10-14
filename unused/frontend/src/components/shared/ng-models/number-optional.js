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
	'monitool.components.ng-models.number-optional',
	[
	]
);


module.component('optionalNumber', {
	require: {
		ngModelCtrl: 'ngModel'
	},

	template: require('./number-optional.html'),

	bindings: {
		default: '<',
		message: '@'
	},

	controller: class OptionalNumberController {

		$onInit() {
			this.ngModelCtrl.$render = () => {
				this.specifyValue = this.ngModelCtrl.$viewValue !== null;
				this.chosenValue = this.ngModelCtrl.$viewValue;
			};
		}

		toggleSpecifyValue() {
			this.specifyValue = !this.specifyValue;
			if (this.specifyValue)
				this.chosenValue = this.default;

			this.onValueChange();
		}

		onValueChange() {
			this.ngModelCtrl.$setViewValue(this.specifyValue ? this.chosenValue : null);
		}
	}
});


export default module.name;
