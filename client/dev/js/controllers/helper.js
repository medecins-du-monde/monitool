"use strict";

angular
	.module('monitool.controllers.helper', [])

	.controller('MainMenuController', function($q, $state, $rootScope, $scope, $translate, $location) {
		$scope.$state   = $state;
		$scope.language = $translate.use();
		
		$scope.changeLanguage = function(langKey) {
			$translate.use(langKey);
			$scope.language = langKey;
		};

		$scope.logout = function() {
			window.location.href = 'https://mdm1.sharepoint.com';
		};
	})
