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

import {range} from '../../../../../helpers/array';


const module = angular.module(
	'monitool.components.ng-models.partition-order',
	[
	]
);


module.component('partitionOrder', {
	bindings: {
		partitions: '<',
		distribution: '<',
		onUpdate: '&'
	},
	template: require('./partition-order.html'),

	controller: class PartitionOrderController {

		$onChanges(changes) {
			// Make an editable version of the partitions (one way data bindings).
			this.editablePartitions = angular.copy(this.partitions);

			// Tell the template about the table layout
			this.table = {
				// rows and cols for this table.
				leftCols: range(0, this.distribution),
				headerRows: range(this.distribution, this.partitions.length)
			};

			// Update size in the table cell
			const width = this.table.headerRows.reduce((m, i) => m * this.partitions[i].elements.length, 1);
			const height = this.table.leftCols.reduce((m, i) => m * this.partitions[i].elements.length, 1);
			this.size = width + 'x' + height;
		}

		// We do not allow values to be present 2 times in the list.
		onValueChange(index) {
			const missing = this.partitions.find(p => !this.editablePartitions.find(op => op.id === p.id));
			const dupIndex = this.editablePartitions.findIndex((op, i) => i !== index && op.id === this.editablePartitions[index].id);

			this.editablePartitions[dupIndex] = angular.copy(missing);
			this.onUpdate({partitions: this.editablePartitions});
		}
	}
});


export default module;
