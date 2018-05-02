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

import uiRouter from '@uirouter/angularjs';
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import 'angular-legacy-sortablejs-maintained';

import mtComponentIndicatorDisplay from '../../../../../components/indicator/display';
import mtComponentIndicatorModal from '../../../../../components/indicator/edition-modal';
import mtDirectiveAutoresize from '../../../../../directives/helpers/autoresize';


const module = angular.module(
	'monitool.pages.project.structure.logicalframe.edit',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
		'ng-sortable',

		mtDirectiveAutoresize.name,
		mtComponentIndicatorDisplay.name,
		mtComponentIndicatorModal.name,
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.logical_frame_edition', {
		url: '/logical-frame/:index',
		template: require('./logframe-edit.html'),
		controller: 'ProjectLogicalFrameEditController'
	});
});


module.controller('ProjectLogicalFrameEditController', function($scope, $state, $stateParams, $filter, $timeout, $uibModal) {

	/////////////////////
	// Allow purposes, outputs and indicators reordering. We need to hack around bugs
	// in current Sortable plugin implementation.
	// @see https://github.com/RubaXa/Sortable/issues/581
	// @see https://github.com/RubaXa/Sortable/issues/722
	/////////////////////

	$scope.purposeSortOptions = {group:'purposes', handle: '.purpose-handle'};
	$scope.outputSortOptions = {group:'outputs', handle: '.output-handle'};
	$scope.activitySortOptions = {group:'activities', handle: '.activity-handle'};
	$scope.indicatorsSortOptions = {
		group:'indicators',
		handle: '.indicator-handle',
		onStart: function() { document.body.classList.add('dragging'); },
		onEnd: function() { document.body.classList.remove('dragging'); }
	};

	$scope.onSortableMouseEvent = function(group, enter) {
		if (group == 'outputs')
			$scope.purposeSortOptions.disabled = enter;
		else if (group == 'activities')
			$scope.purposeSortOptions.disabled = $scope.outputSortOptions.disabled = enter;
		else if (group == 'indicators')
			$scope.purposeSortOptions.disabled = $scope.outputSortOptions.disabled = $scope.activitySortOptions = enter;
	};

	$scope.logicalFrameIndex = $stateParams.index;

	/////////////////////
	// Create and remove elements from logical frame
	/////////////////////

	$scope.addPurpose = function() {
		$scope.editableProject.logicalFrames[$scope.logicalFrameIndex].purposes.push({
			description: "", assumptions: "", indicators: [], outputs: []
		});
	};

	$scope.addOutput = function(purpose) {
		purpose.outputs.push({
			description: "", activities: [], assumptions: "", indicators: []
		});
	};

	$scope.addActivity = function(output) {
		output.activities.push({
			description: "", indicators: []
		});
	};

	$scope.remove = function(element, list) {
		list.splice(list.indexOf(element), 1);
	};

	// handle indicator add, edit and remove are handled in a modal window.
	$scope.addIndicator = function(parent) {
		var promise = $uibModal.open({
			controller: 'ProjectIndicatorEditionModalController',
			template: require('../../../../../components/indicator/edition-modal.html'),
			size: 'lg',
			scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
			resolve: {planning: function() { return null; }, indicator: function() { return null; }}
		}).result;

		promise.then(function(newPlanning) {
			if (newPlanning)
				parent.push(newPlanning);
		});
	};

	var w1 = $scope.$watch('editableProject.logicalFrames[logicalFrameIndex]', function(form) {
		if (!form) {
			w1();
			$state.go('main.project.structure.logical_frame_list');
		}
	});

	$scope.deleteLogicalFrame = function() {
		// Kill the watches
		w1();

		// Remove the form
		$scope.editableProject.logicalFrames.splice($scope.logicalFrameIndex, 1);
		$scope.$parent.save(true).then(function() {
			$state.go('main.project.structure.logical_frame_list');
		});
	};
});

export default module;
