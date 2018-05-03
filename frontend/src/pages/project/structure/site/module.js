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

import mtComponentsUtcDatepicker from '../../../../components/form/utc-datepicker';


const module = angular.module(
	'monitool.pages.project.structure.site',
	[
		uiRouter, // for $stateProvider
		uiSelect, // for site groups
		'ng-sortable', // order sites

		mtComponentsUtcDatepicker.name, // Datepicker start & end
	]
);


module.config(function($stateProvider) {
	$stateProvider.state('main.project.structure.collection_site_list', {
		url: '/sites',
		template: require('./collection-site-list.html'),
		controller: 'ProjectCollectionSiteListController'
	});
});


/**
 * Controller used by the "main.project.structure.collection_site_list" state.
 * Allows to change entities and groups.
 */
module.controller('ProjectCollectionSiteListController', function($scope) {
	$scope.createEntity = function() {
		$scope.editableProject.entities.push({id: uuid(), name: '', start: null, end: null});
	};

	$scope.deleteEntity = function(entityId) {
		$scope.editableProject.entities = $scope.editableProject.entities.filter(e => e.id !== entityId);
		$scope.editableProject.sanitize();
	};

	$scope.createGroup = function() {
		$scope.editableProject.groups.push({id: uuid(), name: '', members: []});
	};

	$scope.deleteGroup = function(groupId) {
		$scope.editableProject.groups = $scope.editableProject.groups.filter(group => group.id !== groupId);
	};
});

export default module;
