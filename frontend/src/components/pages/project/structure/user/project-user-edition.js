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
import uiModal from 'angular-ui-bootstrap/src/modal/index';

const module = angular.module(
	'monitool.components.ui-modals.project-user-edition',
	[
		uiModal
	]
);



/**
 * Component used on a modal called from "main.project.structure.user_list"
 * Allows to edit a user
 */
module.component('projectUserModal', {

	bindings: {
		resolve: '<',
		close: '&',
		dismiss: '&'
	},

	template: require('./project-user-edition.html'),

	controller: class ProjectUserModalController {

		isUnchanged() {
			return angular.equals(this.masterUser, this.user);
		}

		$onChanges(changes) {
			this.entities = this.resolve.entities;
			this.groups = this.resolve.groups;
			this.dataSources = this.resolve.dataSources;

			// Build the list of users that are available on the select box
			// Available users are user that are not already taken (besides current one).
			this.availableUsers = this.resolve.allUsers.filter(user => {
				var isTakenInProject = this.resolve.allProjectUsers.find(u => u.id == user._id),
					isTakenByMe      = this.resolve.projectUser && this.resolve.projectUser.id === user._id;

				return isTakenByMe || !isTakenInProject;
			});

			// Build the list of forbidden usernames if creating a partner account.
			this.partners = this.resolve.allProjectUsers.filter(u => {
				if (this.resolve.projectUser)
					return u.type == 'partner' && u.username !== this.resolve.projectUser.username;
				else
					return u.type == 'partner';
			}).map(u => u.username);

			// isNew will be used by the view to disable inputs that can't be changed (username, etc), and show delete button.
			this.isNew = !this.resolve.projectUser;

			// The form updates a copy of the object, so that user can cancel the changes by just dismissing the modal.
			this.user = angular.copy(this.resolve.projectUser) || {type: "internal", id: null, role: "owner", entities: [], dataSources: []};
			this.user.entities = this.user.entities || [];
			this.user.dataSources = this.user.dataSources || [];

			this.masterUser = angular.copy(this.user);
		}

		reset() {
			angular.copy(this.masterUser, this.user);
		}

		done() {
			if (this.user.type == 'internal') {
				delete this.user.login;
				delete this.user.password;
			}
			else
				delete this.user.id;

			if (this.user.role != 'input') {
				delete this.user.entities;
				delete this.user.dataSources;
			}

			this.close({$value: this.user});
		}

		delete() {
			this.close();
		}

	}
});


export default module;
