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

import User from '../../../../models/user';

const module = angular.module(
	'monitool.components.pages.project.structure.user',
	[
		uiRouter, // for $stateProvider
		'ng-sortable'
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

	$scope.editUser = function(user) {
		var promise = $uibModal.open({
			controller: 'ProjectUserModalController',
			template: require('./user-modal.html'),
			size: 'lg',
			scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
			resolve: { allUsers: function() { return users; }, projectUser: function() { return user; } }
		}).result;

		promise.then(function(newUser) {
			if (user && !newUser) // Delete
				$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1);
			else if (!user && newUser) // Add
				$scope.editableProject.users.push(newUser);
			else if (user && newUser) // Replace
				$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1, newUser);
		});
	};
});


export default module;

