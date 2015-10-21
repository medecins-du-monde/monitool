"use strict";

angular
	.module('monitool.controllers.helper', [])

	.controller('MainMenuController', function($state, $scope, $translate, $locale, $rootScope) {
		$scope.$state = $state;
		
		$scope.changeLanguage = function(langKey) {
			$translate.use(langKey);

			if (langKey == 'fr')
				angular.copy(FRENCH_LOCALE, $locale);
			else if (langKey == 'es')
				angular.copy(SPANISH_LOCALE, $locale);
			else
				angular.copy(ENGLISH_LOCALE, $locale);

			$rootScope.language = langKey;
			$scope.$broadcast('languageChange');
		};

		$scope.logout = function() {
			window.location.href = 'https://mdm1.sharepoint.com';
		};
	})

	.controller('HomeController', function($scope) {
		
	})

	.controller('HelpMenuController', function($scope) {
		// tell page which are read for now
		$scope.isDocRead = function(page) {
			return !!window.localStorage['doc.' + page];
		};
	})

	.controller('HelpController', function($state, $scope, $timeout) {
		// Mark current page as read after 5 seconds
		var promise = $timeout(function() {
			window.localStorage['doc.' + $state.current.name.slice($state.current.name.lastIndexOf('.') + 1)] = 1;
		}, 5000);

		// if user leaves before 5s, cancel the timeout.
		$scope.$on('$destroy', function() {
			$timeout.cancel(promise);
		});
	});
