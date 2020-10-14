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
import uiModal from 'angular-ui-bootstrap/src/modal/index';

import mtPartitionEdition from './partition-edition';

const module = angular.module(
	'monitool.components.data-source.partition-list',
	[
		uiModal,
		mtPartitionEdition
	]
);

module.component('partitionList', {
	bindings: {
		'readOnlyPartitions': '<partitions',
		'onUpdate': '&'
	},
	template: require('./partition-list.html'),
	controller: class PartitionListController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onChanges(changes) {
			this.partitions = angular.copy(this.readOnlyPartitions)
		}

		editPartition(partition) {
			this.$uibModal
				.open({
					component: 'partitionEditionModal',
					size: 'lg',
					resolve: {
						partition: () => partition
					}
				})
				.result
				.then(newPartition => {
					if (newPartition)
						angular.copy(newPartition, partition);
					else
						this.partitions.splice(this.partitions.indexOf(partition), 1);

					this.onUpdate({partitions: this.partitions});
				})
				.catch(e => {});
		};

		addPartition() {
			this.$uibModal
				.open({
					component: 'partitionEditionModal',
					size: 'lg'
				})
				.result
				.then(newPartition => {
					this.partitions.push(newPartition);

					console.log('added')
					this.onUpdate({partitions: this.partitions});
				})
				.catch(e => {});
		};
	}
});

export default module.name;
