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

"use strict";

angular.module('monitool.controllers.project.input', [])

	.controller('ProjectCollectionInputListController', function($scope, $state, $stateParams, itertools, inputsStatus, Input) {
		$scope.form = $scope.masterProject.forms.find(function(f) { return f.id == $stateParams.formId; });

		//////
		// Create planning.
		//////
		$scope.inputsStatus = inputsStatus;
		$scope.columns = $scope.masterProject.entities.filter(function(e) { return $scope.form.entities.indexOf(e.id) !== -1; });

		// => restrict columns depending on user permissions
		if ($scope.userCtx.role !== 'admin') {
			var projectUser = $scope.masterProject.users.find(function(u) {
				return ($scope.userCtx.type == 'user' && u.id == $scope.userCtx._id) ||
					   ($scope.userCtx.type == 'partner' && u.username == $scope.userCtx.username);
			});

			if (projectUser.role === 'input')
				$scope.columns = $scope.columns.filter(function(column) {
					return projectUser.entities.indexOf(column.id) !== -1;
				});
		}

		$scope.displayFooter = $scope.form.periodicity === 'free';

		//////
		// pass information needed for creating new inputs on free forms.
		//////

		$scope.newInputDate = {date: new Date(Math.floor(Date.now() / 86400000) * 86400000)};
		
		$scope.addInput = function(entityId) {
			var period = $scope.newInputDate.date.toISOString().substring(0, 10);
			$state.go('main.project.input.edit', {period: period, formId: $scope.form.id, entityId: entityId});
		};
	})

	.controller('ProjectCollectionInputEditionController', function($scope, $state, $filter, $stateParams, inputs) {
		$scope.form = $scope.masterProject.forms.find(function(f) { return f.id == $stateParams.formId; });
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.lastInput     = inputs.previous;
		$scope.master        = angular.copy($scope.currentInput)
		
		var entity   = $scope.masterProject.entities.find(function(e) { return e.id == $scope.currentInput.entity; });
		$scope.inputEntityName = entity ? entity.name : 'shared.project';

		$scope.copy = function() {
			angular.copy($scope.lastInput.values, $scope.currentInput.values);
		};

		$scope.save = function() {
			pageChangeWatch()
			$scope.currentInput.$save(function() { $state.go('main.project.input.list'); });
		};

		$scope.reset = function() {
			angular.copy($scope.master, $scope.currentInput);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.currentInput);
		};

		$scope.delete = function() {
			var easy_question = $filter('translate')('project.delete_input');

			if (window.confirm(easy_question)) {
				pageChangeWatch(); // remove the change page watch, because it will trigger otherwise.
				$scope.currentInput.$delete(function() {
					$state.go('main.project.input.list');
				});
			}
		};

		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// if unsaved changes were made
			if (!angular.equals($scope.master, $scope.currentInput)) {
				// then ask the user if he meant it
				if (!window.confirm($filter('translate')('shared.sure_to_leave')))
					event.preventDefault();
			}
		});
	})
