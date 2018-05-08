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

import Indicator from '../../../services/models/indicator';
import Theme from '../../../services/models/theme';


const module = angular.module(
	'monitool.pages.indicator.list',
	[
		uiRouter, // for $stateProvider
	]
);


module.config(function($stateProvider) {

	if (window.user.type == 'user') {
		$stateProvider.state('main.indicators', {
			url: '/indicators',
			template: require('./list.html'),
			controller: 'IndicatorListController',
			resolve: {
				indicators: () => Indicator.fetchAll(),
				themes: () => Theme.fetchAll()
			}
		});
	}
});


module.controller('IndicatorListController', function($scope, indicators, themes) {
	$scope.themes = [];

	var noThematicsIndicators = indicators.filter(i => i.themes.length == 0);
	if (noThematicsIndicators.length)
		$scope.themes.push({definition: null, translate: 'zero_theme_indicator', indicators: noThematicsIndicators});

	// Create a category with indicators that match project on 2 thematics or more
	var manyThematicsIndicators = indicators.filter(i => i.themes.length > 1);
	if (manyThematicsIndicators.length)
		$scope.themes.push({definition: null, translate: 'multi_theme_indicator', indicators: manyThematicsIndicators});

	// Create a category with indicators that match project on exactly 1 thematic
	themes.forEach(theme => {
		var themeIndicators = indicators.filter(i => i.themes.length === 1 && i.themes[0] === theme._id);
		if (themeIndicators.length !== 0)
			$scope.themes.push({definition: theme, indicators: themeIndicators});
	});

	// This getter will be used by the orderBy directive to sort indicators in the partial.
	$scope.getName = function(indicator) {
		return indicator.name[$scope.language];
	};
});

export default module;
