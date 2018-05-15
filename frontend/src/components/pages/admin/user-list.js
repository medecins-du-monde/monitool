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
import uiModal from 'angular-ui-bootstrap/src/modal/index';

import User from '../../../models/user';

import mtUserModal from '../../ui-modals/user-edition';

const module = angular.module(
	'monitool.components.pages.admin.userlist',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
		mtUserModal.name,
	]
);


module.config(function($stateProvider) {
	if (window.user.type == 'user' && window.user.role == 'admin') {
		$stateProvider.state('main.admin.users', {
			component: 'userList',
			url: '/admin/users',
			resolve: {
				users: () => User.fetchAll()
			}
		});
	}
});


module.component('userList', {
	bindings: {
		'users': '<'
	},
	template: require('./user-list.html'),

	controller: class UserListController {

		constructor($rootScope, $uibModal) {
			this.userCtx = $rootScope.userCtx;
			this.$uibModal = $uibModal;
		}

		$onChanges(changes) {
			this.displayedUsers = this.users.filter(user => user._id !== this.userCtx._id);
			this.displayedUsers.sort((a, b) => a._id < b._id ? -1 : 1);
		}

		edit(user) {
			this.$uibModal
				.open({
					component: 'userEditModal',
					size: 'lg',
					resolve: {user: () => user}
				})
				.result
				.then(newUser => {
					angular.copy(newUser, user)
					user.save()
				})
				.catch(error => {});
		}
	}
});


export default module;
