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

import User from '../../../services/models/user';


const module = angular.module(
	'monitool.pages.admin.userlist',
	[
		uiRouter, // for $stateProvider
		uiModal, // for $uibModal
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
	template: require('./list.html'),

	controller: function($rootScope, $uibModal) {
		this.onChanges = () => {
			this.users = users.filter(user => user._id !== $rootScope.userCtx._id);
			this.users.sort((a, b) => a._id < b._id ? -1 : 1);
		};

		this.edit = user => {
			var backup = angular.copy(user);
			var promise = $uibModal.open({
				controller: 'UserEditModalController',
				template: require('./edit-modal.html'),
				size: 'lg',
				resolve: {user: () => user}
			}).result;

			promise
				.then(function() { user.save(); })
				.catch(function() { angular.copy(backup, user); })
		};
	}
});


module.controller("UserEditModalController", function($scope, $uibModalInstance, user) {
	$scope.user = user;
	$scope.master = angular.copy(user);

	$scope.$watch('user', function() {
		$scope.hasChanged = !angular.equals($scope.user, $scope.master);
	}, true);

	$scope.save = function() {
		$uibModalInstance.close();
	};

	$scope.cancel = function() {
		$uibModalInstance.dismiss();
	};
});

export default module;
