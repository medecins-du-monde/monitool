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

import mtModelInput from '../../../../services/models/input';
import mtFilterTimeSlot from '../../../../filters/time-slot';

const module = angular.module(
	'monitool.pages.project.input.list',
	[
		uiRouter, // for $stateProvider

		mtModelInput.name,
		mtFilterTimeSlot.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.input.list', {
		url: '/list',
		template: require('./collection-input-list.html'),
		controller: 'ProjectCollectionInputListController',
		resolve: {
			inputsStatus: function(Input, project, $stateParams) {
				return Input.fetchFormStatus(project, $stateParams.formId);
			}
		}
	});
});


module.controller('ProjectCollectionInputListController', function($scope, $state, $stateParams, inputsStatus, Input) {
	$scope.form = $scope.masterProject.forms.find(f => f.id == $stateParams.formId);

	//////
	// Create planning.
	//////
	$scope.inputsStatus = inputsStatus;
	$scope.columns = $scope.masterProject.entities.filter(e => $scope.form.entities.includes(e.id));

	// => restrict columns depending on user permissions
	if ($scope.userCtx.role !== 'admin') {
		var projectUser = $scope.masterProject.users.find(u => {
			return ($scope.userCtx.type == 'user' && u.id == $scope.userCtx._id) ||
				   ($scope.userCtx.type == 'partner' && u.username == $scope.userCtx.username);
		});

		if (projectUser.role === 'input') {
			// This will happen regardless of unexpected entries.
			$scope.columns = $scope.columns.filter(e => projectUser.entities.includes(e.id));
		}
	}

	$scope.visibleStatus = Object.keys($scope.inputsStatus).slice(-10);
	$scope.hiddenStatus = Object.keys($scope.inputsStatus).slice(0, -10);

	$scope.showMore = function() {
		$scope.visibleStatus = [...$scope.hiddenStatus.slice(-10), ...$scope.visibleStatus];
		$scope.hiddenStatus.splice(-10, 10);
	};

	//////
	// Free periodicity allow entering data as needed.
	//////
	if ($scope.form.periodicity === 'free') {
		$scope.displayFooter = true;
		$scope.newInputDate = {
			date: new Date(Math.floor(Date.now() / 86400000) * 86400000).toISOString().substring(0, 10)
		};

		$scope.addInput = function(entityId) {
			$state.go('main.project.input.edit', {
				period: $scope.newInputDate.date,
				formId: $scope.form.id,
				entityId: entityId
			});
		};
	}
});

export default module;
