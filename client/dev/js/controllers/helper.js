"use strict";

angular
	.module('monitool.controllers.helper', [])

	.controller('MainMenuController', function($q, $state, $scope, $translate, session) {
		$scope.$state   = $state;
		$scope.language = $translate.use();
		
		if (!session)
			$state.go('main.login', {}, {reload: false});
		else
			$scope.userCtx  = session;

		$scope.changeLanguage = function(langKey) {
			$translate.use(langKey);
			$scope.language = langKey;
		};

		// $scope.logout = function() {
		// 	mtDatabase.remote.logout().then(function() {
		// 		$state.go('main.login', {}, {reload: true});
		// 	});
		// };
	})

	.controller('LoginController', function($state, $scope) {
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
	})

	.controller('ChangePasswordController', function($scope, session) {
		$scope.login = session.userCtx.name;
	});
