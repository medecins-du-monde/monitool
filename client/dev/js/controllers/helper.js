"use strict";

angular
	.module('monitool.controllers.helper', [])

	.controller('MainMenuController', function($q, $state, $rootScope, $scope, $translate, $http) {
		$scope.$state   = $state;
		$scope.language = $translate.use();
		
		$scope.changeLanguage = function(langKey) {
			$translate.use(langKey);
			$scope.language = langKey;
		};

		$scope.logout = function() {
			delete $http.defaults.headers.common.Authorization;
			delete sessionStorage.Authorization;
			delete $rootScope.userCtx;
			$state.go('main.login');
		};
	})

	.controller('LoginController', function($state, $rootScope, $scope, $http, mtFetch) {
		$scope.showError = false;
		$state.showLoading = false;

		$scope.tryLogin = function() {
			$scope.showLoading = true;

			$http.defaults.headers.common.Authorization = sessionStorage.Authorization = 'Basic ' + btoa($scope.login + ':' + $scope.password);

			mtFetch.currentUser().then(function(user) {
				$rootScope.userCtx = user;
				$state.go('main.projects');
			}).catch(function(error) {
				$scope.showError = true;
				$scope.showLoading = false;
				$scope.login = $scope.password = '';
			});
		};
	})

	.controller('ChangePasswordController', function($state, $scope, $http, mtFetch) {
		$scope.changePassword = function() {
			mtFetch.changePassword($scope.password).then(function() {
				$http.defaults.headers.common.Authorization = sessionStorage.Authorization = 'Basic ' + btoa($scope.userCtx._id + ':' + $scope.password);
				$state.go('main.projects');
			});
		};
	});
