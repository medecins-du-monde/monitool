"use strict";

angular.module('monitool.controllers.project.shared', [])

	.controller('ProjectListController', function($scope, projects, themes) {
		$scope.themes         = themes;
		$scope.pred           = 'name'; // default sorting predicate
		
		$scope.runningProjects  = projects.filter(function(p) { return p.end >= new Date() });
		$scope.finishedProjects = projects.filter(function(p) { return p.end < new Date() });
		$scope.projects         = $scope.runningProjects;
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, project, indicatorsById) {
		if ($stateParams.projectId === 'new') {
			project.owners.push($scope.userCtx._id);
			project.dataEntryOperators.push($scope.userCtx._id);
		}

		$scope.project = project;
		$scope.master = angular.copy(project);
		$scope.indicatorsById = indicatorsById;


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
				$scope.project._id = makeUUID();

			return $scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				
				if ($stateParams.projectId === 'new')
					$state.go('main.project.basics', {projectId: $scope.project._id});
			}).catch(function(error) {
				$scope.error = error;
			});
		};

		var menuWatch = $scope.$watch('project', function(project) {
			$scope.projectHasIndicators = false;
			for (var indicatorId in project.indicators) {
				$scope.projectHasIndicators = true;
				break;
			}

			$scope.projectHasForms = false;
			project.forms.forEach(function(form) {
				form.sections.forEach(function(section) {
					if (section.elements.length)
						$scope.projectHasForms = true;
				});
			});

			$scope.projectHasEntities = !!project.entities.length;
		}, true);


		// is this still useful?
		$scope.$on('languageChange', function(e) {
			// @hack that will make copies of all dates, and force datepickers to redraw...
			$scope.project = angular.copy($scope.project);
		});

		$scope.reset = function() {
			$scope.project = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.project);
		};

		$scope.getAssignedIndicators = function() {
			var result = [];
			result = $scope.project.logicalFrame.indicators.concat(result);
			$scope.project.logicalFrame.purposes.forEach(function(purpose) {
				result = purpose.indicators.concat(result);
				purpose.outputs.forEach(function(output) {
					result = output.indicators.concat(result);
				});
			});
			return result;
		};

		$scope.getUnassignedIndicators = function() {
			var assignedIndicators = $scope.getAssignedIndicators();
			return Object.keys($scope.project.indicators).filter(function(indicatorId) {
				return assignedIndicators.indexOf(indicatorId) === -1;
			});
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.collection_site_list', 'main.project.basics', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.stay_here_check')))
					event.preventDefault();
				else
					$scope.reset();
			}
		});
	})
