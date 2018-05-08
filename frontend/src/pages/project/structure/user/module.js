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

import User from '../../../../services/models/user';

const module = angular.module(
	'monitool.pages.project.structure.user',
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


/**
 * Controller used on a modal called from "main.project.structure.user_list"
 * Allows to edit a user
 */
module.controller('ProjectUserModalController', function($scope, $uibModalInstance, allUsers, projectUser) {
	// Build the list of users that are available on the select box
	// Available users are user that are not already taken (besides current one).
	$scope.availableUsers = allUsers.filter(user => {
		var isTakenInProject = $scope.editableProject.users.find(u => u.id == user._id),
			isTakenByMe      = projectUser && projectUser.id === user._id;

		return isTakenByMe || !isTakenInProject;
	});

	// Build the list of forbidden usernames if creating a partner account.
	$scope.partners = $scope.editableProject.users.filter(u => {
		if (projectUser)
			return u.type == 'partner' && u.username !== projectUser.username;
		else
			return u.type == 'partner';
	}).map(u => u.username);

	// isNew will be used by the view to disable inputs that can't be changed (username, etc), and show delete button.
	$scope.isNew = !projectUser;

	// The form updates a copy of the object, so that user can cancel the changes by just dismissing the modal.
	$scope.user = projectUser ? angular.copy(projectUser) : {type: "internal", id: null, role: "owner", entities: [], dataSources: []};
	if (!$scope.user.entities)
		$scope.user.entities = [];
	if (!$scope.user.dataSources)
		$scope.user.dataSources = [];

	$scope.masterUser = angular.copy($scope.user);

	$scope.isUnchanged = function() {
		return angular.equals($scope.masterUser, $scope.user);
	};

	$scope.reset = function() {
		angular.copy($scope.masterUser, $scope.user);
	}

	$scope.done = function() {
		if ($scope.user.type == 'internal') {
			delete $scope.user.login;
			delete $scope.user.password;
		}
		else
			delete $scope.user.id;

		if ($scope.user.role != 'input') {
			delete $scope.user.entities;
			delete $scope.user.dataSources;
		}

		$uibModalInstance.close($scope.user);
	};

	$scope.delete = function() { $uibModalInstance.close(null); };
	$scope.cancel = function() { $uibModalInstance.dismiss(); };
});

export default module;

