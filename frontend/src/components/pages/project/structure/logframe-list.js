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
import 'angular-legacy-sortablejs-maintained';

const module = angular.module(
	'monitool.components.pages.project.structure.logicalframe.list',
	[
		uiRouter, // for $stateProvider
		'ng-sortable'
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.logical_frame_list', {
		url: '/logical-frame',
		template: require('./logframe-list.html'),
		controller: 'ProjectLogicalFrameListController'
	});
});


module.controller('ProjectLogicalFrameListController', function($scope, $state) {

	$scope.createLogicalFrame = function(logicalFrame) {
		var newLogicalFrame;
		if (!logicalFrame)
			newLogicalFrame = {name: '', goal: '', start: null, end: null, indicators: [], purposes: []};
		else
			newLogicalFrame = angular.copy(logicalFrame);

		$scope.editableProject.logicalFrames.push(newLogicalFrame);
		$state.go('main.project.structure.logical_frame_edition', {index: $scope.editableProject.logicalFrames.length - 1});
	};
});

export default module;

