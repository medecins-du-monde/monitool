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

import mtGraph from '../../shared/reporting/graph';
import mtProjectGroupBy from './project-group-by';
import mtProjectFilter from './project-filter';
import mtTable from './table';

const module = angular.module(
	'monitool.components.pages.project.reporting_general',
	[
		uiRouter, // for $stateProvider

		mtGraph.name,
		mtProjectGroupBy.name,
		mtProjectFilter.name,
		mtTable.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.reporting_general', {
		url: '/general',
		component: 'generalReporting',
	});
});


module.component('generalReporting', {
	bindings: {
		project: '<',
		ccIndicators: '<'
	},
	template: require('./general.html'),
	controller: class GeneralReportingController {

		$onInit() {
			this.filter = this.groupBy = null
			this.graphs = [];
		}

		onGroupByUpdate(groupBy) {
			this.groupBy = groupBy;
		}

		onFilterUpdate(newFilter) {
			this.filter = newFilter;
		}

		onGraphToggle(id) {
			if (this.graphs.includes(id))
				this.graphs = this.graphs.filter(i => i === id);
			else
				this.graphs = [id, ...graphs];
		}
	}
});


export default module;

