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

const module = angular.module(
	'monitool.components.ui-modals.partition-edition',
	[
		uiModal
	]
);


module.controller('PartitionEditionModalController', function($scope, $uibModalInstance, $filter, currentPartition) {
	$scope.isNew = false;
	if (!currentPartition) {
		currentPartition = {
			id: uuid(),
			name: "",
			elements: [{id: uuid(), name: ""}, {id: uuid(), name: ""}],
			groups: [],
			aggregation: "sum"
		}
		$scope.isNew = true;
	}

	$scope.master = currentPartition;
	$scope.partition = angular.copy(currentPartition);
	$scope.useGroups = !!$scope.partition.groups.length;
	$scope.closedOnPurpose = false;

	$scope.$watch('useGroups', function(value) {
		if (!value)
			$scope.partition.groups = [];
	});

	$scope.$watch('partition.elements.length', function(length) {
		$scope.partitionForm.$setValidity('elementLength', length >= 2);
	});

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.partition);
	};

	$scope.save = function() {
		$scope.closedOnPurpose = true;
		$uibModalInstance.close($scope.partition);
	};

	$scope.reset = function() {
		angular.copy($scope.master, $scope.partition);
		$scope.useGroups = !!$scope.partition.groups.length;
	};

	$scope.createPartitionElement = function() {
		$scope.partition.elements.push({id: uuid(), name: ''});
	};

	$scope.deletePartitionElement = function(peId) {
		// Remove from element list
		$scope.partition.elements = $scope.partition.elements.filter(e => e.id !== peId);

		// Remove from all groups
		$scope.partition.groups.forEach(group => {
			group.members = group.members.filter(id => id !== peId);
		});
	};

	$scope.createGroup = function() {
		$scope.partition.groups.push({id: uuid(), name: '', members: []});
	};

	$scope.deleteGroup = function(pgId) {
		$scope.partition.groups = $scope.partition.groups.filter(g => g.id !== pgId);
	};

	$scope.delete = function() {
		$scope.closedOnPurpose = true;
		$uibModalInstance.close(null);
	};

	$scope.closeModal = function() {
		$uibModalInstance.dismiss(null);
	};

	$scope.$on('modal.closing', function(event) {
		var hasChanged = !$scope.isUnchanged();
		var closedOnPurpose = $scope.closedOnPurpose;

		if (hasChanged && !closedOnPurpose) {
			var question = $filter('translate')('shared.sure_to_leave');
			var isSure = window.confirm(question);
			if (!isSure)
				event.preventDefault();
		}
	});
});

export default module;