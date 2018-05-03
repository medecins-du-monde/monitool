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

import uiRouter from '@uirouter/angularjs';
import uiSelect from 'ui-select';
import 'angular-legacy-sortablejs-maintained';

import 'ui-select/dist/select.min.css';

import mtComponentsOptionalDate from '../../../../../components/form/optional-date';
import mtComponentsElementFilter from '../../../../../components/form/element-filter';
import {computePermutationIndex, computeNthPermutation, range} from '../../../../../helpers/array';


const module = angular.module(
	'monitool.pages.project.structure.datasource.edit',
	[
		uiRouter, // for $stateProvider
		'ng-sortable',

		uiSelect, // for partition group members

		mtComponentsOptionalDate.name, // Datepicker start & end
		mtComponentsElementFilter.name, // Sites & groups associated with form
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.collection_form_edition', {
		url: '/data-source/:formId',
		template: require('./collection-form-edition.html'),
		controller: 'ProjectCollectionFormEditionController',
	});
});


/**
 * Controller used by the "main.project.structure.collection_form_edit" state.
 * Allows to edit a data sources.
 */
module.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, $uibModal, $timeout) {

	$scope.container = {}
	$scope.toggle = function(variableId) {
		if ($scope.container.visibleElement !== variableId)
			$scope.container.visibleElement = variableId;
		else
			$scope.container.visibleElement = null;
	}

	/////////////////////
	// Pass the form to the shared controller over it, to be able
	// to enable and disable the save button.
	/////////////////////

	// Put the form index in the scope to be able to access it without searching each time.
	$scope.currentFormIndex = $scope.editableProject.forms.findIndex(function(f) { return f.id == $stateParams.formId; });

	$scope.deleteForm = function() {
		// Kill the watches
		w1(); w3();

		// Remove the form
		$scope.editableProject.forms.splice($scope.currentFormIndex, 1);

		// Give some time for the watches to update the flags
		$timeout(function() {
			$scope.$parent.save(true).then(function() {
				$state.go('main.project.structure.collection_form_list');
			});
		});
	};

	// Watch currentForm. If undefined, means that user clicked "cancel changes" on a new project.
	var w1 = $scope.$watch('editableProject.forms[currentFormIndex]', function(form) {
		if (!form) {
			w1(); w3();
			$state.go('main.project.structure.collection_form_list');
		}
	});

	// Watch form to invalidate HTML form on some conditions
	var w3 = $scope.$watch('editableProject.forms[currentFormIndex].elements.length', function(length) {
		// A datasource is valid only when containing one or more variables.
		$scope.forms.current.$setValidity('elementsLength', length >= 1);
	});

	$scope.editPartition = function(element, currentPartition) {
		$uibModal.open({
			controller: 'PartitionEditionModalController',
			template: require('./partition-modal.html'),
			size: 'lg',
			resolve: { currentPartition: function() { return currentPartition; } }
		}).result.then(function(updatedPartition) {
			var sizeChanged = false;

			// Partition was deleted
			if (currentPartition && !updatedPartition) {
				element.partitions.splice(element.partitions.indexOf(currentPartition), 1);
				sizeChanged = true;
			}
			// Partition was updated
			else if (currentPartition && updatedPartition)
				element.partitions[element.partitions.indexOf(currentPartition)] = updatedPartition;
			// Partition was added
			else if (!currentPartition && updatedPartition) {
				sizeChanged = true;
				element.partitions.push(updatedPartition);
			}

			if (sizeChanged) {
				element.distribution = Math.ceil(element.partitions.length / 2);
				element.order = 0;
			}
		});
	};

	$scope.newVariable = function() {
		var newVariable = {
			id: uuid(), name: "", partitions: [], order: 0, distribution: 0, geoAgg: 'sum', timeAgg: 'sum'
		};

		$scope.editableProject.forms[$scope.currentFormIndex].elements.push(newVariable);
		$scope.toggle(newVariable.id);
	};

	$scope.remove = function(item, target) {
		var index = target.findIndex(function(arrItem) { return item.id === arrItem.id; });
		if (index !== -1)
			target.splice(index, 1)
	};
});


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

	$scope.deletePartitionElement = function(partitionElementId) {
		// Remove from element list
		$scope.partition.elements = $scope.partition.elements.filter(function(element) {
			return element.id !== partitionElementId;
		});

		// Remove from all groups
		$scope.partition.groups.forEach(function(group) {
			group.members = group.members.filter(function(member) {
				return member !== partitionElementId;
			});
		});
	};

	$scope.createGroup = function() {
		$scope.partition.groups.push({id: uuid(), name: '', members: []});
	};

	$scope.deleteGroup = function(partitionGroupId) {
		$scope.partition.groups = $scope.partition.groups.filter(function(group) {
			return group.id !== partitionGroupId;
		});
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


module.directive('partitionDistribution', function() {
	return {
		restrict: "E",
		require: "ngModel",
		scope: {
			numPartitions: '='
		},
		template: require('./partition-distribution.html'),
		link: function(scope, element, attributes, ngModelController) {
			// This unique identifier used for the radio name. This is the same for all radios.
			scope.uniqueIdentifier = 'i_' + Math.random().toString().slice(2);

			// We need to use a container for the distribution value because we use it inside a ng-repeat which have its own scope
			scope.container = {}

			// To render the ngModelController, we just pass the distribution value to the scope.
			ngModelController.$render = function() {
				scope.container.distribution = ngModelController.$viewValue;
			};

			// When the chosen distribution changes, we tell the ngModelController
			scope.$watch('container.distribution', function(d) {
				ngModelController.$setViewValue(d);
			});

			// At start and when numPartitions changes...
			scope.$watch("numPartitions", function(numPartitions) {
				// ... we check that current distribution is valid.
				if (scope.container.distribution > numPartitions)
					scope.container.distribution = 0;

				// ... we redraw the tables when the user changes the number of partitions.
				scope.tables = [];

				for (var distribution = 0; distribution <= numPartitions; ++distribution) {
					scope.tables.push({
						// distribution will be the value for each radio.
						distribution: distribution,

						// Unique identifier used for each radio. This is to match the label with each radio.
						uniqueIdentifier: 'i_' + Math.random().toString().slice(2),

						// rows and cols for this table.
						leftCols: range(0, distribution),
						headerRows: range(distribution, numPartitions)
					});
				}
			});
		}
	};
});


module.directive('partitionOrder', function() {
	return {
		restrict: "E",
		require: "ngModel",
		scope: {
			partitions: '=',
			distribution: '='
		},
		template: require('./partition-order.html'),
		link: function(scope, element, attributes, ngModelController) {
			var updateSize = function() {
				// update the size value
				var width = 1, height = 1;
				scope.table.headerRows.forEach(function(index) { width *= scope.orderedPartitions[index].elements.length; });
				scope.table.leftCols.forEach(function(index) { height *= scope.orderedPartitions[index].elements.length; });
				scope.size = width + ' x ' + height;
			};

			// we should only watch partitions.length, partitions[*].id and partitions[*].name
			// but that will do it.
			// however it's a bit overkill (will reset partitin order when we change an element name)
			scope.$watch('partitions', function(newValue, oldValue) {
				if (!angular.equals(oldValue, newValue)) {

					// Reset ordered partitions only when a partition was added or removed
					if (oldValue.length !== newValue.length) {
						scope.orderedPartitions = scope.partitions.slice();

						scope.table = {
							// rows and cols for this table.
							leftCols: range(0, scope.distribution),
							headerRows: range(scope.distribution, scope.partitions.length)
						};
					}
					else {
						// If the number of partitions was not changed, we need
						// to recreate .orderedPartitions anyway, because partition objects can be swapped
						// (not the same reference, even is the value is close).
						scope.orderedPartitions = scope.orderedPartitions.map(function(partition) {
							return scope.partitions.find(function(p) {
								return partition.id === p.id;
							});
						});
					}

					updateSize();
				}
			}, true);

			// Tell the template about the table layout
			scope.$watch('distribution', function() {
				scope.table = {
					// rows and cols for this table.
					leftCols: range(0, scope.distribution),
					headerRows: range(scope.distribution, scope.partitions.length)
				};

				updateSize();
			});

			// We do not allow values to be present 2 times in the list.
			scope.$watchCollection('orderedPartitions', function(after, before) {
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
			});

			// To render the ngModelController, we just pass the orderedPartitions to the scope.
			ngModelController.$render = function() {
				scope.orderedPartitions = ngModelController.$viewValue.slice();
			};

			ngModelController.$parsers.push(function(viewValue) {
				return computePermutationIndex(
					scope.orderedPartitions.map(function(partition) {
						return scope.partitions.indexOf(partition);
					})
				);
			});

			ngModelController.$formatters.push(function(modelValue) {
				return computeNthPermutation(scope.partitions.length, modelValue)
					.map(function(index) { return scope.partitions[index]; });
			});
		}
	};
});


export default module;