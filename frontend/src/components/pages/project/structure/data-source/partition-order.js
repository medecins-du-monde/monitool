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

import {computePermutationIndex, computeNthPermutation, range} from '../../../../../helpers/array';


const module = angular.module(
	'monitool.components.ng-models.partition-order',
	[
	]
);


module.component('partitionOrder', {
	require: {
		'ngModelCtrl': 'ngModel'
	},
	bindings: {
		partitions: '<',
		distribution: '<'
	},
	template: require('./partition-order.html'),

	controller: class PartitionOrderController {

		$onInit() {
			// To render the ngModelController, we just pass the orderedPartitions to the scope.
			this.ngModelCtrl.$render = () => {
				this.orderedPartitions = this.ngModelCtrl.$viewValue.slice();
			};

			// Convert viewvalue 6!-1 to modelValue [3, 2, 1]
			this.ngModelCtrl.$parsers.push(viewValue => {
				return computePermutationIndex(
					this.orderedPartitions.map(partition => this.partitions.indexOf(partition))
				);
			});

			this.ngModelCtrl.$formatters.push(modelValue => {
				return computeNthPermutation(this.partitions.length, modelValue).map(i => this.partitions[i]);
			});
		}

		$onChanges(changes) {
			if (changes.partitions) {
				// we should only watch partitions.length, partitions[*].id and partitions[*].name
				// but that will do it.
				// however it's a bit overkill (will reset partitin order when we change an element name)
				// const [oldValue, newValue] = [changes.partitions.]

				if (!angular.equals(oldValue, newValue)) {
					// Reset ordered partitions only when a partition was added or removed
					if (oldValue.length !== newValue.length) {
						this.orderedPartitions = this.partitions.slice();

						this.table = {
							// rows and cols for this table.
							leftCols: range(0, this.distribution),
							headerRows: range(this.distribution, this.partitions.length)
						};
					}
					else {
						// If the number of partitions was not changed, we need
						// to recreate .orderedPartitions anyway, because partition objects can be swapped
						// (not the same reference, even is the value is close).
						this.orderedPartitions = this.orderedPartitions.map(partition => {
							return this.partitions.find(p => partition.id === p.id);
						});
					}

					updateSize();
				}
			}

			// Tell the template about the table layout
			if (changes.distribution) {
				this.table = {
					// rows and cols for this table.
					leftCols: range(0, this.distribution),
					headerRows: range(this.distribution, this.partitions.length)
				};

				updateSize();
			}
		}

		// We do not allow values to be present 2 times in the list.
		onValueChange() {
			// Did last change cause a duplicate?
			var hasDuplicates = false,
				duplicates = {};

			for (var index = 0; index < scope.partitions.length; ++index)
				if (duplicates[after[index].id]) {
					hasDuplicates = true;
					break;
				}
				else
					duplicates[after[index].id] = true;

			// If we have duplicates it means the change was made by human action
			if (hasDuplicates) {
				// Remove the duplicate
				var changedIndex = 0
				for (; changedIndex < scope.partitions.length; ++changedIndex)
					if (after[changedIndex] !== before[changedIndex])
						break;

				var oldIndex = before.indexOf(after[changedIndex]);

				scope.orderedPartitions[oldIndex] = before[changedIndex];
			}

			// tell ngModelController that the viewValue changed
			ngModelController.$setViewValue(scope.orderedPartitions.slice());

			updateSize();
		}

		_getTableSize(table, partitions) {
			// FIXME this is clearly bugged
			// update the size value
			let width = 1, height = 1;
			table.headerRows.forEach(index => width *= partitions[index].elements.length);
			table.leftCols.forEach(index => height *= partitions[index].elements.length);

			return width + ' x ' + height;
		}
	}
});


export default module;
