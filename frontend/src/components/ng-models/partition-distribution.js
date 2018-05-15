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

import {computePermutationIndex, computeNthPermutation, range} from '../../helpers/array';


const module = angular.module(
	'monitool.components.ng-models.partition-distribution',
	[
	]
);


module.component('partitionDistribution', {
	require: {
		'ngModelCtrl': 'ngModel',
	},
	bindings: {
		numPartitions: '<'
	},
	template: require('./partition-distribution.html'),

	controller: class PartitionDistributionController {

		$onChanges(changes) {
			// ... we check that current distribution is valid.
			if (this.distribution > this.numPartitions)
				this.distribution = 0;

			// ... we redraw the tables when the user changes the number of partitions.
			this.distributions = [];

			for (var i = 0; i <= this.numPartitions; ++i) {
				this.distributions.push({
					value: i,

					// Unique identifier used for each radio. This is to match the label with each radio.
					radioId: 'i_' + Math.random().toString().slice(2),

					// rows and cols for this table.
					leftCols: range(0, i),
					headerRows: range(i, this.numPartitions)
				});
			}
		}

		$onInit() {
			// This unique identifier used for the radio name. This is the same for all radios.
			this.radioName = 'i_' + Math.random().toString().slice(2);

			// To render the ngModelController, we just pass the distribution value to the scope.
			this.ngModelCtrl.$render = () => {
				this.distribution = this.ngModelCtrl.$viewValue;
			};
		}

		onValueChange() {
			this.ngModelCtrl.$setViewValue(this.distribution);
		}
	}
});


export default module;