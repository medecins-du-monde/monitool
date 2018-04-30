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
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import mtComponentsUtcDatepicker from '../../../../components/form/utc-datepicker';


const module = angular.module(
	'monitool.pages.project.structure.basics',
	[
		uiRouter, // for $stateProvider
		uiSelect, // Select themes

		mtComponentsUtcDatepicker.name, // Datepicker start & end
	]
);


module.config(function($stateProvider) {
	$stateProvider.state('main.project.structure.basics', {
		url: '/basics',
		template: require('./basics.html'),
		controller: 'ProjectBasicsController'
	});
})


/**
 * Controller used by the "main.project.structure.basics" state.
 * Allows to change basic informations.
 */
module.controller('ProjectBasicsController', function($scope, themes) {
	$scope.themes = themes;
	$scope.startDateOptions = {maxDate: $scope.editableProject.end};
	$scope.endDateOptions = {minDate: $scope.editableProject.start};
});


export default module;
