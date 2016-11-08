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
			$state.go('main.project.structure.basics', {projectId: uuid.v4()});
		};

		$scope.open = function(project) {
			var projectUser = project.users.find(function(u) {
				return ($scope.userCtx.type == 'user' && u.id == $scope.userCtx._id) ||
					   ($scope.userCtx.type == 'partner' && u.username == $scope.userCtx.username);
			});

			if (projectUser && projectUser.role == 'owner')
				$state.go("main.project.structure.basics", {projectId: project._id});
			else
				$state.go("main.project.reporting.general", {projectId: project._id});
		};
	})
	
	.controller('ProjectMenuController', function($scope, $filter, $state, project) {
		$scope.masterProject = project;

		// When master changes, update menu elements
		$scope.$watch('masterProject', function() {
			$scope.projectReadyForReporting = $scope.masterProject.isReadyForReporting();
		}, true);

		$scope.wantFold = true;
		$scope.isStructureVisible = function() {
			if (!$scope.isStructureFoldable())
				return true;

			
			return true;
		};

		$scope.isStructureFoldable = function() {
			return false;
		};

		$scope.structureSwitchVisibility = function() {
			if (!$scope.isStructureFoldable())
				$scope.wantFold = !$scope.wantFold;
		};
	

		$scope.cloneProject = function() {
			var newName = window.prompt($filter('translate')('project.please_enter_new_name'));

			if (newName)
				$scope.master.clone(newName, $rootScope.userCtx._id)
					.$save()
					.then(function() { $state.go('main.projects'); })
					.catch(function(error) { $scope.error = error; });
		};

		$scope.deleteProject = function() {
			var translate = $filter('translate'),
				question  = translate('project.are_you_sure_to_delete'),
				answer    = translate('project.are_you_sure_to_delete_answer');

			if (window.prompt(question) === answer)
				project.$delete(function() { $state.go('main.projects'); });
		};
	})
