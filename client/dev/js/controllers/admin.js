"use strict";

angular.module('monitool.controllers.admin', [])

	.controller('UsersController', function($scope, users) {
		$scope.users = users.filter(function(user) {
			return user._id !== $scope.userCtx._id;
		});

		$scope.users.forEach(function(user) {
			user.__choices = {
				_admin: user.roles.indexOf('_admin') !== -1,
				project: user.roles.indexOf('project') !== -1,
				indicator: user.roles.indexOf('indicator') !== -1
			};
		});

		$scope.masters = angular.copy($scope.users);

		$scope.save = function(index) {
			var user = $scope.users[index];

			user.roles = [];
			for (var role in user.__choices)
				if (user.__choices[role])
					user.roles.push(role);

			user.$save(function(error) {
				user.__choices = {
					_admin: user.roles.indexOf('_admin') !== -1,
					project: user.roles.indexOf('project') !== -1,
					indicator: user.roles.indexOf('indicator') !== -1
				};
				$scope.masters[index] = angular.copy(user);
			});
		};

		$scope.reset = function(index) {
			$scope.users[index] = angular.copy($scope.masters[index]);
		};

		$scope.isUnchanged = function(index) {
			return angular.equals($scope.masters[index], $scope.users[index]);
		};
	})


	.controller('ThemeTypeListController', function($scope, $state, mtFetch, entities) {
		entities.sort(function(entity1, entity2) {
			return entity1.name.localeCompare(entity2.name);
		});

		$scope.entities = entities;
		$scope.master = angular.copy(entities);
		$scope.entityType = $state.current.data.entityType;

		$scope.hasChanged = function(entityIndex) {
			return !angular.equals($scope.entities[entityIndex], $scope.master[entityIndex]);
		};

		$scope.create = function() {
			var newEntity = mtFetch[$scope.entityType]();
			newEntity.__isNew = true; // this will be removed on save.
			newEntity._id = makeUUID()

			$scope.entities.push(newEntity);
			$scope.master.push(angular.copy(newEntity));
		};

		$scope.save = function(entityIndex) {
			var entity = $scope.entities[entityIndex],
				usage  = entity.__usage;

			entity.$save(function(error) {
				entity.__usage = usage;
				$scope.master[entityIndex] = angular.copy(entity);
			});
		};

		$scope.remove = function(entityIndex) {
			var entity = $scope.entities.splice(entityIndex, 1)[0];
			$scope.master.splice(entityIndex, 1);

			if (!entity.__isNew)
				entity.$delete();
		};
	});
