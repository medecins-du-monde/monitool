
import uiModal from 'angular-ui-bootstrap/src/modal/index';

import mtPartitionEdition from './partition-edition';

const module = angular.module(
	'monitool.components.data-source.partition-list',
	[
		uiModal,
		mtPartitionEdition.name
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

					this.onUpdate({partitions: partitions});
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

					this.onUpdate({partitions: partitions});
				})
				.catch(e => {});
		};
	}
});

export default module;