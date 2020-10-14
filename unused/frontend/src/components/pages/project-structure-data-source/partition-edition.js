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
import uuid from 'uuid/v4';

const module = angular.module(
	'monitool.components.ui-modals.partition-edition',
	[
	]
);


module.component('partitionEditionModal', {
	bindings: {
		resolve: '<',
		modalInstance: '<',
		close: '&',
		dismiss: '&'
	},
	template: require('./partition-edition.html'),
	controller: class PartitionEditionModalController {

		constructor($scope, $filter) {
			this.translate = $filter('translate');
			this.$scope = $scope;
		}

		$onInit() {
			this.$scope.$on('modal.closing', event => {
				if (!this.isUnchanged() && !this.closedOnPurpose) {
					var question = this.translate('shared.sure_to_leave');
					var isSure = window.confirm(question);
					if (!isSure)
						event.preventDefault();
				}
			});
		}

		$onChanges(changes) {
			if (this.resolve.partition) {
				this.isNew = false;
				this.master = this.resolve.partition;
			}
			else {
				this.isNew = true;
				this.master = {
					id: uuid(),
					name: "",
					elements: [{id: uuid(), name: ""}, {id: uuid(), name: ""}],
					groups: [],
					aggregation: "sum"
				};
			}

			this.partition = angular.copy(this.master);
			this.useGroups = !!this.partition.groups.length;
			this.closedOnPurpose = false;
		}

		isUnchanged() {
			return angular.equals(this.master, this.partition);
		}

		save() {
			this.closedOnPurpose = true;
			if (!this.useGroups)
				this.partition.groups.length = 0;

			this.close({'$value': this.partition});
		}

		reset() {
			angular.copy(this.master, this.partition);
			this.useGroups = !!this.partition.groups.length;
		}

		createPartitionElement() {
			this.partition.elements.push({id: uuid(), name: ''});
			this.partitionForm.$setValidity('elementLength', this.partition.elements.length >= 2);
		}

		deletePartitionElement(peId) {
			// Remove from element list
			this.partition.elements = this.partition.elements.filter(e => e.id !== peId);

			// Remove from all groups
			this.partition.groups.forEach(group => {
				group.members = group.members.filter(id => id !== peId);
			});

			this.partitionForm.$setValidity('elementLength', this.partition.elements.length >= 2);
		}

		createGroup() {
			this.partition.groups.push({id: uuid(), name: '', members: []});
		}

		deleteGroup(pgId) {
			this.partition.groups = this.partition.groups.filter(g => g.id !== pgId);
		}

		delete() {
			this.closedOnPurpose = true;
			this.close();
		}

	}
});


export default module.name;
