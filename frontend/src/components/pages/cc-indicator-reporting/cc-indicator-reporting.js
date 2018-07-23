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

import Theme from '../../../models/theme';
import Indicator from '../../../models/indicator';
import Project from '../../../models/project';

import mtFilter from './cc-indicator-filter';
import mtGroupBy from './cc-indicator-group-by';


const module = angular.module(
	'monitool.components.pages.indicator.reporting',
	[
		uiRouter, // for $stateProvider

		mtFilter.name,
		mtGroupBy.name
	]
);


module.config($stateProvider => {

	if (window.user.type == 'user') {
		$stateProvider.state('main.indicator_reporting', {
			url: '/indicator/:indicatorId',
			component: 'ccIndicatorReporting',
			resolve: {
				themes: () => Theme.fetchAll(),
				ccIndicator: ($stateParams) => Indicator.get($stateParams.indicatorId),
				projects: ($stateParams) => Project.fetchCrossCutting($stateParams.indicatorId)
			}
		});
	}
});


module.component('ccIndicatorReporting', {
	bindings: {
		themes: '<',
		ccIndicator: '<',
		projects: '<'
	},

	template: require('./cc-indicator-reporting.html'),

	controller: class IndicatorReportingController {
		
	}
});

export default module;

