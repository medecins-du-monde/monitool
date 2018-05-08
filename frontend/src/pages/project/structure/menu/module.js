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

const module = angular.module(
	'monitool.pages.project.structure.menu',
	[
		uiRouter // for $stateProvider
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure', {
		abstract: true,
		controller: 'ProjectEditController',
		template: require('./menu.html')
	});

});


/**
 * Controller used by "main.project.structure" state.
 *
 * It handles:
 * 		- A warning when the user try to change current page without saving changes.
 *		- Form validation + save & reset" buttons
 */
module.controller('ProjectEditController', function($scope, $filter, $transitions, indicators) {
	$scope.editableProject = angular.copy($scope.masterProject);	// Current version of project.
	$scope.projectSaveRunning = false;				// We are not currently saving.
	$scope.forms = {current: undefined};

	// When project changes, update save flags
	var onProjectChange = function() {
		$scope.projectChanged = !angular.equals($scope.masterProject, $scope.editableProject);

		$scope.projectSavable = $scope.projectChanged;
		if ($scope.forms.current)
			$scope.projectSavable = $scope.projectSavable && $scope.forms.current.$valid;
	};

	var projectWatch = $scope.$watch('editableProject', onProjectChange, true);
	var formWatch = $scope.$watch('forms.current.$valid', onProjectChange);

	// Restore $scope.master to avoid unsaved changes from a given page to pollute changes to another one.
	let cancelListener = $transitions.onStart({}, function(transition) {
		// If project is currently saving, disable all links
		if ($scope.projectSaveRunning) {
			transition.abort();
			return;
		}

		// If project is changed, warn user that changes will be lost.
		if ($scope.projectChanged && !window.confirm($filter('translate')('shared.sure_to_leave'))) {
			transition.abort();
			return;
		}

		// Either project has not changed, or the user is OK with loosing changes.
		// => We are leaving.
		$scope.reset();
		if (transition.to().name.substr(0, 'main.project.structure'.length) !== 'main.project.structure')
			cancelListener();
	});

	// save, reset and isUnchanged are all defined here, because those are shared between all project views.
	$scope.save = async function(force) {
		// When button is disabled, do not execute action.
		if (!force) {
			if (!$scope.projectSavable || $scope.projectSaveRunning)
				return;
		}

		$scope.projectSaveRunning = true;
		$scope.editableProject.sanitize(indicators);

		try {
			await $scope.editableProject.save()

			$scope.$apply(() => {
				angular.copy($scope.editableProject, $scope.masterProject);
				$scope.projectChanged = false;
				$scope.projectSavable = false;
				$scope.projectSaveRunning = false;
				$scope.$broadcast('projectSaved');
			});
		}
		catch (error) {
			$scope.$apply(() => {
				// Display message to tell user that it's not possible to save.
				var translate = $filter('translate');
				alert(translate('project.saving_failed'));
				$scope.projectSaveRunning = false;
			});
		}
	};

	$scope.reset = function() {
		// When button is disabled, do not execute action.
		if (!$scope.projectChanged || $scope.projectSaveRunning)
			return;

		// Clone last saved version of project.
		angular.copy($scope.masterProject, $scope.editableProject);
		$scope.$broadcast('projectReset');
	};
});

export default module;

