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
import uiRouter from '@uirouter/angularjs';
import Cube from '../../../../services/statistics/cube';

const module = angular.module(
	'monitool.pages.project.reporting.menu',
	[
		uiRouter // for $stateProvider
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.reporting', {
		url: '/reporting',
		template: '<div ui-view></div>',
		controller: 'ProjectSharedReportingController'
	});

});

module.controller('ProjectSharedReportingController', function($scope) {
	Cube.fetchProject($scope.masterProject._id).then(cs => {
		$scope.$apply(() => {
			// Index cubes by id.
			var cubes = {};
			cs.forEach(c => cubes[c.id] = c);
			$scope.cubes = cubes;
		});
	});
});


export default module;
