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
import uuid from 'uuid/v4';

import uiRouter from '@uirouter/angularjs';

import mtDirectiveAclProjectCreation from '../../../directives/acl/project-creation';
import mtDirectiveAclProjectRole from '../../../directives/acl/project-role';
import mtDirectiveAclProjectInput from '../../../directives/acl/project-input';
import mtModelProject from '../../../services/models/project';
import mtModelIndicator from '../../../services/models/indicator';
import mtModelTheme from '../../../services/models/theme';


const module = angular.module(
	'monitool.pages.project.menu',
	[
		uiRouter, // for $stateProvider

		mtDirectiveAclProjectCreation.name,
		mtDirectiveAclProjectRole.name,
		mtDirectiveAclProjectInput.name,
		mtModelProject.name,
		mtModelIndicator.name,
		mtModelTheme.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project', {
		abstract: true,
		url: window.user.type == 'user' ? '/projects/:projectId' : '/project',
		controller: 'ProjectMenuController',
		template: require('./menu.html'),
		resolve: {
			project: function(Project, $rootScope, $stateParams, $q) {
				// If partner account, we retrieve the projectId from profile, else from URL.
				var projectId = $rootScope.userCtx.type === 'user' ? $stateParams.projectId : $rootScope.userCtx.projectId;

				return Project.get({id: projectId}).$promise.catch(function(e) {
					// Project creation
					if (e.status !== 404)
						return $q.reject(e);

					var project = new Project();
					project._id = projectId;
					project.reset();
					project.users.push({ type: "internal", id: $rootScope.userCtx._id, role: "owner" });
					return $q.when(project);
				});
			},
			indicators: function(Indicator) {
				return Indicator.query().$promise;
			},
			themes: function(Theme) {
				return Theme.query().$promise;
			}
		}
	});
});


module.controller('ProjectMenuController', function($scope, $filter, $state, project, $http) {
	var translate = $filter('translate');

	$scope.masterProject = project;

	// When master changes, update menu elements
	$scope.$watch('masterProject', function() {
		$scope.projectReadyForReporting = $scope.masterProject.isReadyForReporting();
	}, true);

	$scope.cloneProject = function() {
		var question = translate('project.are_you_sure_to_clone');

		if (window.confirm(question)) {
			var newProjectId = 'project:' + uuid();
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
});


export default module;
