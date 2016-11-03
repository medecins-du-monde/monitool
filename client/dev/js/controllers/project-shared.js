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

		$scope.open = function(projectId) { 
			$state.go("main.project.structure.basics", {projectId: projectId});
		};
	})
	
	.controller('ProjectMenuController', function($scope, project) {
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
