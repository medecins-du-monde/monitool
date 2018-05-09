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

import Project from '../../../services/models/project';
import Theme from '../../../services/models/theme';

import mtDirectiveAclProjectCreation from '../../../directives/acl/project-creation';

const module = angular.module(
	'monitool.pages.project.list',
	[
		uiRouter, // for $stateProvider

		mtDirectiveAclProjectCreation.name,
	]
);


module.config(function($stateProvider) {
	if (window.user.type == 'user') {
		$stateProvider.state('main.projects', {
			url: '/projects',
			component: 'projectList',
			resolve: {
				projects: () => Project.fetchShort(),
				themes: () => Theme.fetchAll()
			}
		});
	}
});


module.component('projectList', {
	bindings: {
		'projects': '<',
		'themes': '<',
	},

	template: require('./list.html'),

	controller: function($rootScope, $state) {

		this.$onChanges = changes => {
			this.changeTab('my');
		};

		this.$onInit = () => {
			this.pred = 'country'; // default sorting predicate
		};

		this.changeTab = tab => {
			this.tab = tab;

			const now = new Date().toISOString().substring(0, 10);

			switch (tab) {
				case 'my':
					this.displayedProjects = this.projects.filter(p => p.users.find(u => u.id == $rootScope.userCtx._id));
					break;
				case 'running':
					this.displayedProjects = this.projects.filter(p => p.end >= now);
					break;
				case 'finished':
					this.displayedProjects = this.projects.filter(p => p.end < now);
					break;
			}
		};

		this.createProject = () => {
			$state.go('main.project.structure.basics', {projectId: 'project:' + uuid()});
		};

		this.open = project => {
			var projectUser = project.users.find(u => {
				return ($rootScope.userCtx.type == 'user' && u.id == $rootScope.userCtx._id) ||
					   ($rootScope.userCtx.type == 'partner' && u.username == $rootScope.userCtx.username);
			});

			if (projectUser && projectUser.role == 'owner')
				$state.go("main.project.structure.basics", {projectId: project._id});
			else
				$state.go("main.project.reporting.general", {projectId: project._id});
		};
	}
});

export default module;
