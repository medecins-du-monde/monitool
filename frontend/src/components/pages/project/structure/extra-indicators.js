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
import uiModal from 'angular-ui-bootstrap/src/modal/index';
import 'angular-legacy-sortablejs-maintained';

import mtIndicatorEditionModal from '../../../shared/indicator/indicator-edition';

const module = angular.module(
	'monitool.components.pages.project.structure.extraindicator',
	[
		uiRouter, // for $stateProvider
		uiModal,
		'ng-sortable',

		mtIndicatorEditionModal.name,
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.extra', {
		url: '/extra',
		template: require('./extra-indicators.html'),
		controller: 'ProjectExtraIndicators',
	});

});


module.controller('ProjectExtraIndicators', function($scope, $uibModal) {
	$scope.addIndicator = function() {
		$uibModal
			.open({
				component: 'indicatorEditionModal',
				size: 'lg',
				resolve: {
					planning: () => null,
					indicator: () => null,
					dataSources: () => $scope.editableProject.forms
				}
			})
			.result
			.then(newPlanning => {
				if (newPlanning)
					$scope.editableProject.extraIndicators.push(newPlanning);
			});
	};
});


export default module;

