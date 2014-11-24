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

helperControllers.controller('LoginController', function($scope, $location, mtDatabase, mtStatus) {
	$scope.tryLogin = function() {
		mtDatabase.remote.login($scope.login, $scope.password).then(function(user) {
			$scope.userInfo.name = user.lastname;

		}).catch(function(error) {
			console.log('login failed')
		});
	};
});


helperControllers.controller('MenuController', function($scope, $location, $translate) {
	// Application startup
	// $location.url('/');

	// // Try to log user in from local credentials
	// $scope.userInfo = {};
	// mtDatabase.local.get('_local/credentials').then(function(cred) {
	// 	return mtDatabase.remote.login(cred.login, cred.password);
	// }).then(function(user) {
	// 	$scope.userInfo.name = user.lastname;
	// }).catch(function(error) {
	// 	$location.url('login');
	// });


	$scope.currentPage = $location.path().split('/')[1];
	$scope.language    = $translate.use();

	$scope.changeLanguage = function(langKey) {
		$translate.use(langKey);
		$scope.language = langKey;
	};

	$scope.changePage = function(page) {
		$location.url('/' + page);
		$scope.currentPage = page;
	};
});


helperControllers.controller('SubMenuController', function($scope, $routeParams, $location) {
	$scope.currentPage = $location.path().split('/')[3];
	$scope.projectId = $routeParams.projectId;

	$scope.changePage = function(page) {
		if ($routeParams.projectId !== 'new')
			$location.url('/projects/' + $routeParams.projectId + '/' + page);
	};

	$scope.goto = function(url) {
		$location.url(url);
	};
});
