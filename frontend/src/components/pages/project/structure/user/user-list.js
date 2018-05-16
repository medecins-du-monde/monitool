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

import User from '../../../../../models/user';
import mtProjectUserEditModal from './project-user-edition';

const module = angular.module(
	'monitool.components.pages.project.structure.user',
	[
		uiRouter, // for $stateProvider
		'ng-sortable',

		mtProjectUserEditModal.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.user_list', {
		url: '/users',
		template: require('./user-list.html'),
		controller: 'ProjectUserListController',
		resolve: {
			users: () => User.fetchAll()
		}
	});
});


/**
 * Controller used by the "main.project.structure.user_list" state.
 * Allows to list and reorder users that can access/edit the project.
 */
module.controller('ProjectUserListController', function($scope, $uibModal, $filter, users) {
	$scope.users = {};
	users.forEach(user => $scope.users[user._id] = user);

	$scope.editUser = function(user=null) {
		$uibModal
			.open({
				component: 'projectUserModal',
				size: 'lg',
				resolve: {
					allUsers: () => users,
					projectUser: () => user,
					allProjectUsers: () => $scope.editableProject.users,
					entities: () => $scope.editableProject.entities,
					groups: () => $scope.editableProject.groups,
					dataSources: () => $scope.editableProject.forms,
				}
			})
			.result
			.then(newUser => {
				// Edit
				if (user) {
					if (newUser) // Replace
						$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1, newUser);
					else // Delete
						$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1);
				}
				// Create
				else
					$scope.editableProject.users.push(newUser);
			})
			.catch(error => {});
	};
});


export default module;

