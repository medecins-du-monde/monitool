"use strict";

angular.module(
	'monitool.controllers.project.shared',
	[
		'monitool.services.utils.uuid'
	])

	.controller('ProjectListController', function($scope, projects, themes) {
		$scope.themes = themes;
		$scope.pred = 'name'; // default sorting predicate

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
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, project, uuid) {
		if ($stateParams.projectId === 'new')
			project.users.push({ type: "internal", id: $scope.userCtx._id, role: "owner" });
		
		$scope.master = angular.copy(project);
		$scope.project = project;
		
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
				menuWatch();
				pageChangeWatch();

				project.$delete(function() {
					$state.go('main.projects');
				});
			}
		};

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			if ($stateParams.projectId === 'new')
				$scope.project._id = uuid.v4();

			return $scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				
				if ($stateParams.projectId === 'new')
					$state.go('main.project.basics', {projectId: $scope.project._id});
			}).catch(function(error) {
				$scope.error = error;
			});
		};

		var menuWatch = $scope.$watch('project', function(project) {
			$scope.projectHasIndicators = $scope.project.hasObjectiveReporting();
			$scope.projectActivityReady = $scope.project.hasActivityReporting();
		}, true);

		$scope.reset = function() {
			$scope.project = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.project);
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.collection_site_list', 'main.project.basics', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.sure_to_leave')))
					$scope.reset();
				else
					event.preventDefault();
			}
		});
	})
