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
import mtIndicatorEditionModal from '../../../shared/indicator/indicator-edition';

const module = angular.module(
	'monitool.components.pages.project.structure.crosscutting',
	[
		uiRouter, // for $stateProvider
		uiModal,

		mtIndicatorEditionModal.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.structure.cross_cutting', {
		url: '/cross-cutting',
		template: require('./cc-indicator-list.html'),
		controller: 'ProjectCrossCuttingController',
	});
});


module.controller('ProjectCrossCuttingController', function($scope, $uibModal, indicators, themes) {
	$scope.themes = [];

	// Create a category with indicators that match project on 2 thematics or more
	var manyThematicsIndicators = indicators.filter(indicator => {
		const commonThemes = indicator.themes.filter(themeId => $scope.masterProject.themes.includes(themeId));
		return indicator.themes.length > 1 && commonThemes.length > 0;
	});

	if (manyThematicsIndicators.length)
		$scope.themes.push({definition: null, indicators: manyThematicsIndicators});

	// Create a category with indicators that match project on exactly 1 thematic
	themes.forEach(theme => {
		if ($scope.masterProject.themes.includes(theme._id)) {
			var themeIndicators = indicators.filter(i => i.themes.length === 1 && i.themes[0] === theme._id);
			if (themeIndicators.length !== 0)
				$scope.themes.push({definition: theme, indicators: themeIndicators});
		}
	});

	// Indicator add, edit and remove are handled in a modal window.
	$scope.editIndicator = function(indicatorId) {
		var planning = $scope.editableProject.crossCutting[indicatorId];

		$uibModal
			.open({
				component: 'indicatorEditionModal',
				size: 'lg',
				resolve: {
					planning: () => planning,
					indicator: () => indicators.find(i => i._id == indicatorId),
					dataSources: () => $scope.editableProject.forms
				}
			})
			.result
			.then(function(newPlanning) {
				if (!newPlanning)
					delete $scope.editableProject.crossCutting[indicatorId];
				else
					$scope.editableProject.crossCutting[indicatorId] = newPlanning;
			})
			.catch(error => {})
	};
});

export default module;
