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

import '@bower_components/font-awesome/css/font-awesome.min.css';

import angular from 'angular';

import mtPages from './pages/module';
import mtTranslation from './translation/bootstrap';
import mtFilterMisc from './filters/misc';

const module = angular.module(
	'monitool.app',
	[
		mtPages.name,
		mtTranslation.name,
		mtFilterMisc.name
	]
);


module.run(function($rootScope) {
	$rootScope.userCtx = window.user;
});


module.config(function($urlRouterProvider) {
	$urlRouterProvider.otherwise('/home');
});


module.run(function($rootScope, $window, $state) {
	// Scroll to top when changing page.
	$rootScope.$on('$stateChangeSuccess', function(e, toState, toParams, fromState, fromParams) {
		$window.scrollTo(0, 0);
	});

	$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
		if (error.status === 401) {
			alert("Session has expired, you need to log in again");
			window.location.reload();
		}

		console.log(error)
		console.log(error.stack)
	});
});


angular.bootstrap(document, [module.name]);

