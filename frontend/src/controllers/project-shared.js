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

angular.module(
	'monitool.controllers.project.shared',
	[
		'monitool.services.utils.uuid'
	])

	.controller('ProjectListController', function($scope, $state, projects, uuid, themes) {
		var now = new Date().toISOString().substring(0, 10);

		$scope.themes = themes;
		$scope.pred = 'country'; // default sorting predicate

		$scope.myProjects = projects.filter(function(p) {
			return p.users.find(function(u) { return u.id == $scope.userCtx._id; });
		});

		$scope.runningProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end >= now
		});

		$scope.finishedProjects = projects.filter(function(p) {
			return $scope.myProjects.indexOf(p) === -1 && p.end < now
		});

		$scope.projects = $scope.myProjects;

		$scope.createProject = function() {
			$state.go('main.project.structure.basics', {projectId: 'project:' + uuid.v4()});
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

	.controller('ProjectMenuController', function($scope, $filter, $state, project, $http, uuid) {
		var translate = $filter('translate');

		$scope.masterProject = project;

		// When master changes, update menu elements
		$scope.$watch('masterProject', function() {
			$scope.projectReadyForReporting = $scope.masterProject.isReadyForReporting();
		}, true);

		$scope.cloneProject = function() {
			var question = translate('project.are_you_sure_to_clone');

			if (window.confirm(question)) {
				var newProjectId = 'project:' + uuid.v4();
				var options = {
					method: 'PUT',
					url: '/api/resources/project/' + newProjectId,
					params: {
						from: $scope.masterProject._id,
						with_data: 'true'
					}
				};

				$http(options).then(
					function() {
						$state.go('main.project.structure.basics', {projectId: newProjectId});
					},
					function(error) {
						$scope.error = error;
					}
				);
			}
		};

		$scope.deleteProject = function() {
			var question = translate('project.are_you_sure_to_delete'),
				answer = translate('project.are_you_sure_to_delete_answer');

			if (window.prompt(question) === answer)
				project.$delete(function() { $state.go('main.projects'); });
		};
	})
