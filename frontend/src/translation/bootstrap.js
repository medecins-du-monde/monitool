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

import angular from 'angular';

import ngTranslate from 'angular-translate';
import ngTranslateLocalStorage from 'angular-translate-storage-local';
import ngTranslateCookieStorage from 'angular-translate-storage-cookie';
import ngCookies from 'angular-cookies';

import frenchTranslation from './fr/translations';
import englishTranslation from './en/translations';
import spanishTranslation from './es/translations';

import frenchLocale from './fr/locale';
import englishLocale from './en/locale';
import spanishLocale from './es/locale';


const module = angular.module(
	'monitool.translation',
	[
		ngTranslate,
		ngTranslateLocalStorage,
		ngTranslateCookieStorage,
		ngCookies
	]
);


/**
 * Init translation modules
 */
module.config(function($translateProvider) {
	$translateProvider.translations('fr', frenchTranslation);
	$translateProvider.translations('en', englishTranslation);
	$translateProvider.translations('es', spanishTranslation);

	$translateProvider.useLocalStorage();
	$translateProvider.preferredLanguage('fr');
	$translateProvider.useSanitizeValueStrategy('escapeParameters');
});


module.run(function($translate, $rootScope, $locale) {
	// Set list of available languages
	$rootScope.languages = {fr: "french", en: "english", es: 'spanish'};

	// Expose scope function to change the language everywhere
	// in the application.
	$rootScope.changeLanguage = function(langKey) {
		$translate.use(langKey);

		if (langKey == 'fr')
			angular.copy(frenchLocale, $locale);
		else if (langKey == 'es')
			angular.copy(spanishLocale, $locale);
		else
			angular.copy(englishLocale, $locale);

		$rootScope.language = langKey;
		$rootScope.$broadcast('languageChange');
		$rootScope.$broadcast('$localeChangeSuccess', langKey, $locale);
	};

	// Set initial language from cookie/local storage
	$rootScope.changeLanguage($translate.use());
});


export default module.name;
