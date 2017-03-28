/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

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
	})

	.controller('HomeController', function($scope) {
		
	});