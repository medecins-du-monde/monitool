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


module.component('partitionFilter', {
	require: {
		ngModelCtrl: 'ngModel'
	},

	bindings: {
		variable: '<'
	},

	template: require('./partition-filter.html'),

	controller: class PartitionFilterController {

		$onInit() {
			this.ngModelCtrl.$parsers.push(this._viewToModel.bind(this));
			this.ngModelCtrl.$formatters.push(this._modelToView.bind(this));
			this.ngModelCtrl.$render = () => this.filter = this.ngModelCtrl.$viewValue;
		}

		$onChanges(changes) {
			if (changes.variable) {
				this.filter = {};

				if (this.variable)
					this.variable.partitions.forEach(partition => {
						this.filter[partition.id] = partition.elements.map(e => e.id);
					});
			}
		}

		onFilterChange() {
			this.ngModelCtrl.$setViewValue(angular.copy(this.filter));
		}

		_viewToModel(viewValue) {
			var modelValue = {};

			if (this.variable)
				this.variable.partitions.forEach(partition => {
					if (viewValue[partition.id].length !== partition.elements.length)
						modelValue[partition.id] = viewValue[partition.id];
				});

			return modelValue;
		}

		_modelToView(modelValue) {
			var viewValue = {};

			if (this.variable)
				this.variable.partitions.forEach(partition => {
					if (modelValue[partition.id])
						viewValue[partition.id] = modelValue[partition.id];
					else
						viewValue[partition.id] = partition.elements.map(e => e.id);
				});

			return viewValue;
		}
	}
});


export default module.name;
