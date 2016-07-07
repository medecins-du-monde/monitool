"use strict";

angular.module(
	'monitool.controllers.project.shared',
	[
		'monitool.services.utils.uuid'
	])

	.controller('ProjectListController', function($scope, $state, projects, uuid, themes) {
		$scope.themes = themes;
		$scope.pred = 'country'; // default sorting predicate

		$scope.myProjects = projects.filter(function(p) {
			return p.users.find(function(u) { return u.id == $scope.userCtx._id; });
		});

		$scope.runningProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end >= new Date()
		});
		
		$scope.finishedProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end < new Date()
		});

		$scope.projects = $scope.myProjects;

		$scope.createProject = function() {
			$state.go('main.project.save.basics', {projectId: uuid.v4()});
		}
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, $rootScope, project, uuid) {
		$scope.master = angular.copy(project);	// Last saved version of the project, or empty one.
		$scope.project = project;				// Current version of project.
		$scope.projectSaveRunning = false;		// We are not currently saving.
		$scope.formContainer = {currentForm: null};

		// When master changes, update menu elements, and save flags
		var masterWatch = $scope.$watch('master', function() {
			$scope.projectHasIndicators = $scope.master.hasObjectiveReporting();
			$scope.projectActivityReady = $scope.master.hasActivityReporting();
		});

		// When project changes, update save flags
		var onProjectChange = function() {
			$scope.projectChanged = !angular.equals($scope.master, $scope.project);

			$scope.projectSavable = $scope.projectChanged;
			if ($scope.formContainer.currentForm)
				$scope.projectSavable = $scope.projectSavable && !$scope.formContainer.currentForm.$invalid;
		};

		var projectWatch = $scope.$watch('project', onProjectChange, true);
		var formWatch = $scope.$watch('formContainer.currentForm', onProjectChange);

		// Restore $scope.master to avoid unsaved changes from a given page to pollute changes to another one.
		var pageChangeWatch = $scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
			// If project is currently saving, disable all links
			if ($scope.projectSaveRunning) {
				e.preventDefault();
				return;
			}

			// If project is changed, warn user that changes will be lost.
			if ($scope.projectChanged) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.sure_to_leave')))
					$scope.reset();
				else
					e.preventDefault();
			}

			$scope.formContainer.currentForm = null;
		});

		$scope.cloneProject = function() {
			var newName = window.prompt($filter('translate')('project.please_enter_new_name'));

			if (newName)
				$scope.project.clone(newName)
					.$save()
					.then(function() { $state.go('main.projects'); })
					.catch(function(error) { $scope.error = error; });
		};

		$scope.deleteProject = function() {
			var translate = $filter('translate'),
				question  = translate('project.are_you_sure_to_delete'),
				answer    = translate('project.are_you_sure_to_delete_answer');

			if (window.prompt(question) === answer) {
				// Remove all watchs before deleting, to avoid errors
				masterWatch();
				projectWatch();
				pageChangeWatch();

				// Delete project
				project.$delete(function() {
					// Go back to project list.
					$state.go('main.projects');
				});
			}
		};

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			// When button is disabled, do not execute action.
			if (!$scope.projectSavable || $scope.projectSaveRunning)
				return;

			$scope.projectSaveRunning = true;

			return $scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				$scope.projectChanged = false;
				$scope.projectSavable = false;
				$scope.projectSaveRunning = false;

			}).catch(function(error) {
				// Display message to tell user that it's not possible to save.
				var translate = $filter('translate');
				alert(translate('project.saving_failed'));

				// reload page.
				window.location.reload();
			});
		};

		$scope.reset = function() {
			// When button is disabled, do not execute action.
			if (!$scope.projectChanged || $scope.projectSaveRunning)
				return;

			// Clone last saved version of project.
			$scope.project = angular.copy($scope.master);
		};
	})
