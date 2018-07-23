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

import Indicator from '../../../models/indicator';
import Theme from '../../../models/theme';
import Project from '../../../models/project';

import uiRouter from '@uirouter/angularjs';

import mtDirectiveAclProjectCreation from '../../../directives/acl/project-creation';
import mtDirectiveAclProjectRole from '../../../directives/acl/project-role';
import mtDirectiveAclProjectInput from '../../../directives/acl/project-input';
import mtDirectiveDisableIf from '../../../directives/helpers/disableif';


const module = angular.module(
	'monitool.components.pages.project.menu',
	[
		uiRouter, // for $stateProvider

		mtDirectiveAclProjectCreation.name,
		mtDirectiveAclProjectRole.name,
		mtDirectiveAclProjectInput.name,
		mtDirectiveDisableIf.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project', {
		abstract: true,
		url: window.user.type == 'user' ? '/projects/:projectId' : '/project',
		component: 'projectMenu',

		resolve: {
			loadedProject: function($rootScope, $stateParams, $q) {
				// If partner account, we retrieve the projectId from profile, else from URL.
				var projectId = $rootScope.userCtx.type === 'user' ? $stateParams.projectId : $rootScope.userCtx.projectId;

				return Project.get(projectId).catch(function(e) {
					// Project creation
					if (e.response.status !== 404)
						return $q.reject(e);

					var project = new Project();
					project._id = projectId;
					project.users.push({ type: "internal", id: $rootScope.userCtx._id, role: "owner" });
					return $q.when(project);
				});
			},
			ccIndicators: () => Indicator.fetchAll(),
			themes: () => Theme.fetchAll()
		}
	});
});


module.component('projectMenu', {
	bindings: {
		loadedProject: '<',
		ccIndicators: '<',
		themes: '<'
	},

	template: require('./menu.html'),

	controller: class ProjectMenuController {

		$onChanges(changes) {
			this.project = this.loadedProject;
		}

		onProjectSaveSuccess(newProject) {
			this.project = newProject;
		}

	}

});


export default module;
