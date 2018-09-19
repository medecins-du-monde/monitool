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
import 'angular-legacy-sortablejs-maintained';

import User from '../../../models/user';
import mtProjectUserEditModal from './project-user-edition';

const module = angular.module(
	'monitool.components.pages.project.structure.user',
	[
		uiRouter, // for $stateProvider
		'ng-sortable',

		mtProjectUserEditModal
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.structure.user_list', {
		url: '/users',
		component: 'projectUserList',
		resolve: {
			users: () => User.fetchAll()
		}
	});
});


module.component('projectUserList', {
	bindings: {
		// injected from ui-router on this route.
		users: '<',

		// injected from parent component.
		project: '<',
		onProjectUpdate: '&'
	},

	template: require('./user-list.html'),

	controller: class ProjectUserListController {

		constructor($uibModal) {
			this.$uibModal = $uibModal;
		}

		$onInit() {
			this.sortableOptions = {
				handle: '.handle',
				onUpdate: () => this.onProjectUpdate({newProject: this.editableProject, isValid: true})
			}
		}

		$onChanges(changes) {
			if (changes.project)
				this.editableProject = angular.copy(this.project);

			if (changes.users) {
				this.usersById = {};
				this.users.forEach(user => this.usersById[user._id] = user);
			}
		}

		onEditUserClicked(user=null) {
			this.$uibModal
				.open({
					component: 'projectUserModal',
					size: 'lg',
					resolve: {
						allUsers: () => this.users,
						projectUser: () => user,
						allProjectUsers: () => this.editableProject.users,
						entities: () => this.editableProject.entities,
						groups: () => this.editableProject.groups,
						dataSources: () => this.editableProject.forms,
					}
				})
				.result
				.then(newUser => {
					// Edit
					if (user) {
						if (newUser) // Replace
							this.editableProject.users.splice(this.editableProject.users.indexOf(user), 1, newUser);
						else // Delete
							this.editableProject.users.splice(this.editableProject.users.indexOf(user), 1);
					}
					// Create
					else
						this.editableProject.users.push(newUser);

					this.onProjectUpdate({newProject: this.editableProject, isValid: true})
				})
				.catch(error => {});
		}

		onDeleteClicked(user) {
			this.editableProject.users.splice(
				this.editableProject.users.indexOf(user),
				1
			);

			this.onProjectUpdate({newProject: this.editableProject, isValid: true});
		}
	}
});


export default module.name;

