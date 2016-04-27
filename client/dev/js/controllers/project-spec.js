"use strict";

angular.module('monitool.controllers.project.spec', [])

	.controller('ProjectBasicsController', function($scope, themes) {
		$scope.themes = themes;
	})

	.controller('ProjectCollectionSiteListController', function($scope, $filter, Input, project) {
		$scope.createEntity = function() {
			$scope.project.createEntity();
		};

		$scope.deleteEntity = function(entityId) {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_entity", projectId: project._id, entityId: entityId}).$promise.then(function(inputIds) {
				var question = $filter('translate')('project.delete_entity', {num_inputs: inputIds.length}),
					answer   = $filter('translate')('project.delete_entity_answer', {num_inputs: inputIds.length});

				var really = inputIds.length == 0 || (inputIds.length && window.prompt(question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really)
					$scope.project.removeEntity(entityId);
			});
		};

		$scope.createGroup = function() {
			$scope.project.createGroup();
		};

		$scope.deleteGroup = function(groupId) {
			$scope.project.removeGroup(groupId);
		};

		$scope.up = function(index, array) {
			var element = array.splice(index, 1);
			array.splice(index - 1, 0, element[0]);
		};

		$scope.down = function(index, array) {
			var element = array.splice(index, 1);
			array.splice(index + 1, 0, element[0]);
		};
	})

	.controller('ProjectUserListController', function($scope, $modal, users) {
		$scope.users = {};
		users.forEach(function(user) { $scope.users[user._id] = user});
		
		$scope.availableEntities = [{id: 'none', name: 'shared.project'}].concat($scope.project.entities);

		$scope.editUser = function(user) {
			var promise = $modal.open({
				controller: 'ProjectUserModalController',
				templateUrl: 'partials/projects/specification/user-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {
					users: function() { return users; },
					user: function() { return user; }
				}
			}).result;

			promise.then(function(newUser) {
				if (user && !newUser)
					$scope.project.users.splice($scope.project.users.indexOf(user), 1);
				else if (!user && newUser)
					$scope.project.users.push(newUser);
				else if (user && newUser)
					$scope.project.users.splice($scope.project.users.indexOf(user), 1, newUser);
			});
		};
	})

	.controller('ProjectUserModalController', function($scope, $modalInstance, users, user) {
		$scope.availableUsers = users.filter(function(availableUser) {
			// user that is currently selected, if there is one.
			if (user && availableUser._id == user.id)
				return true;

			// other user on the list.
			if ($scope.project.users.find(function(u) { return u.id == availableUser._id; }))
				return false;

			// other user
			return true;
		});

		$scope.isNew = !user;
		$scope.user = user ? angular.copy(user) : {
			type: "internal",
			id: null,
			role: "owner",
			entities: []
		};

		$scope.partners = $scope.project.users.filter(function(projectUser) {
			return projectUser.type == 'partner' && projectUser.username !== $scope.user.username;
		}).map(function(projectUser) {
			return projectUser.username;
		});

		$scope.done = function() {
			if ($scope.user.type == 'internal') {
				delete $scope.user.login;
				delete $scope.user.password;
			}
			else
				delete $scope.user.id;

			if ($scope.user.role != 'input')
				delete $scope.user.entities;

			$modalInstance.close($scope.user);
		};

		$scope.delete = function() { $modalInstance.close(null); };
		$scope.cancel = function() { $modalInstance.dismiss() };
	});
