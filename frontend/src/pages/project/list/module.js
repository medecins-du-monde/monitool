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
import uuid from 'uuid/v4';

import mtDirectiveAclProjectCreation from '../../../directives/acl/project-creation';
import mtModelProject from '../../../services/models/project';
import mtModelTheme from '../../../services/models/theme';

const module = angular.module(
	'monitool.pages.project.list',
	[
		uiRouter, // for $stateProvider

		mtDirectiveAclProjectCreation.name,
		mtModelProject.name,
		mtModelTheme.name,
	]
);


if (window.user.type == 'user') {

	module.config(function($stateProvider) {
		$stateProvider.state('main.projects', {
			url: '/projects',
			template: require('./list.html'),
			controller: 'ProjectListController',
			resolve: {
				projects: function(Project) {
					return Project.query({mode: 'short'}).$promise;
				},
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});
	});


	module.controller('ProjectListController', function($scope, $state, projects, themes) {
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
			$state.go('main.project.structure.basics', {projectId: 'project:' + uuid()});
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
}

export default module;