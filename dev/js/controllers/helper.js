"use strict";

var helperControllers = angular.module('monitool.controllers.helper', []);

helperControllers.controller('LoginController', function($state, $scope, mtDatabase) {
	$scope.showError = false;
	$state.showLoading = false;

	$scope.tryLogin = function() {
		$scope.showLoading = true;
		var opts = {ajax: {headers: {Authorization: 'Basic ' + window.btoa($scope.login + ':' + $scope.password)}}};

		mtDatabase.remote.login($scope.login, $scope.password, opts).then(function(user) {
			$state.go('main.projects', {}, {reload: true});
		}).catch(function(error) {
			$scope.showError = true;
			$scope.showLoading = false;
			$scope.login = $scope.password = '';
		});
	};
});


helperControllers.controller('ChangePasswordController', function($scope, userSession, mtDatabase) {
	$scope.login = userSession.userCtx.name;
	
});

helperControllers.controller('MainMenuController', function($q, $state, $scope, $translate, mtDatabase) {
	$scope.$state = $state;
	$scope.language = $translate.use();

	// check that user is logged in
	mtDatabase.remote.getSession().then(function(response) {
		if (!response.userCtx || !response.userCtx.name)
			return $q.reject('No username');

		$scope.userCtx = response.userCtx;
	}).catch(function(error) {
		$state.go('main.login');
	});

	$scope.changeLanguage = function(langKey) {
		$translate.use(langKey);
		$scope.language = langKey;
	};

	$scope.logout = function() {
		mtDatabase.remote.logout().then(function() {
			$state.go('main.login', {}, {reload: true});
		});
	};
});
