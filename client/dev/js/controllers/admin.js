"use strict";

angular
	.module(
		'monitool.controllers.admin',
		[
			
		]
	)

	.controller('UsersController', function($scope, users) {
		$scope.$watch('userCtx', function(userCtx) {
			if (userCtx) {
				$scope.users = users.filter(function(user) { return user._id !== userCtx._id; });
				
				$scope.users.forEach(function(user) {
					user.__choices = {
						_admin: user.roles.indexOf('_admin') !== -1,
						project: user.roles.indexOf('project') !== -1,
						indicator: user.roles.indexOf('indicator') !== -1
					};
				});

				$scope.masters = angular.copy($scope.users);
			}
		});

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

	.controller('ThemeTypeListController', function($scope, $state, Theme, Type, uuid, googleTranslation, entities) {
		entities.sort(function(entity1, entity2) {
			return entity1.name[$scope.language].localeCompare(entity2.name[$scope.language]);
		});

		$scope.entities = entities;
		$scope.master = angular.copy(entities);
		$scope.entityType = $state.current.data.entityType;

		$scope.hasChanged = function(entityIndex) {
			return !angular.equals($scope.entities[entityIndex], $scope.master[entityIndex]);
		};

		$scope.create = function() {
			var newEntity = $scope.entityType == 'theme' ? Theme() : Type();
			newEntity.__isNew = true; // this will be removed on save.
			newEntity._id = uuid.v4();

			$scope.entities.push(newEntity);
			$scope.master.push(angular.copy(newEntity));
		};

		$scope.save = function(entityIndex) {
			var entity = $scope.entities[entityIndex],
				projectUsage = entity.__projectUsage,
				indicatorUsage = entity.__indicatorUsage;

			entity.$save(function(error) {
				entity.__projectUsage = projectUsage;
				entity.__indicatorUsage = indicatorUsage;
				$scope.master[entityIndex] = angular.copy(entity);
			});
		};

		$scope.remove = function(entityIndex) {
			var entity = $scope.entities.splice(entityIndex, 1)[0];
			$scope.master.splice(entityIndex, 1);

			if (!entity.__isNew)
				entity.$delete();
		};

		$scope.translate = function(index, destLanguage, sourceLanguage) {
			googleTranslation.translate($scope.entities[index].name[sourceLanguage], destLanguage, sourceLanguage).then(function(result) {
				$scope.entities[index].name[destLanguage] = result;
			});
		};
	})
