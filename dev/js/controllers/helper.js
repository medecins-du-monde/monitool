"use strict";

var helperControllers = angular.module(
	'monitool.controllers.helper',
	[
		'ui.bootstrap',
		'ui.select',
		'ui.bootstrap.showErrors',
		'angularMoment'
	]
);

helperControllers.controller('LoginController', function($scope, mtDatabase) {
	$scope.tryLogin = function() {
		mtDatabase.remote.login($scope.login, $scope.password).then(function(user) {
			$scope.userInfo.name = user.lastname;

		}).catch(function(error) {
			console.log('login failed')
		});
	};
});


helperControllers.controller('MainController', function($state, $scope, $translate) {
	$scope.$state = $state;
	$scope.language = $translate.use();

	$scope.changeLanguage = function(langKey) {
		$translate.use(langKey);
		$scope.language = langKey;
	};
});
