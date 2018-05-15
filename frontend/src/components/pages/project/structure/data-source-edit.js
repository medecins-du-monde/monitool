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

import mtComponentsOptionalDate from '../../../ng-models/datepicker-optional';
import mtComponentsElementFilter from '../../../ng-models/mselect-with-groups';
import {computePermutationIndex, computeNthPermutation, range} from '../../../../helpers/array';


const module = angular.module(
	'monitool.components.pages.project.structure.datasource.edit',
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
		template: require('./data-source-edit.html'),
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
	$scope.currentFormIndex = $scope.editableProject.forms.findIndex(f => f.id == $stateParams.formId);

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
		var index = target.findIndex(arrItem => item.id === arrItem.id);
		if (index !== -1)
			target.splice(index, 1)
	};
});


export default module;