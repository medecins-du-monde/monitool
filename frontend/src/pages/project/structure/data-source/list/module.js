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
import 'angular-legacy-sortablejs-maintained';


const module = angular.module(
	'monitool.pages.project.structure.datasource.list',
	[
		uiRouter, // for $stateProvider
		'ng-sortable'
	]
);


module.config(function($stateProvider) {
	$stateProvider.state('main.project.structure.collection_form_list', {
		url: '/data-source',
		template: require('./collection-form-list.html'),
		controller: 'ProjectCollectionFormListController'
	});
});


/**
 * Controller used by the "main.project.structure.collection_form_list" state.
 * Allows to list and reorder data sources.
 */
module.controller('ProjectCollectionFormListController', function($scope, $state) {
	$scope.availableEntities = $scope.masterProject.entities;

	$scope.createForm = function() {
		var newForm = {id: uuid(), name: '', periodicity: 'month', entities: [], start: null, end: null, elements: []};
		$scope.editableProject.forms.push(newForm);
		$state.go('main.project.structure.collection_form_edition', {formId: newForm.id});
	};
});

export default module;
