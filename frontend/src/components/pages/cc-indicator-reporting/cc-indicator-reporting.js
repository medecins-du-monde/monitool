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
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

import uiRouter from '@uirouter/angularjs';

import Theme from '../../../models/theme';
import Indicator from '../../../models/indicator';
import Project from '../../../models/project';

import mtFilter from './cc-indicator-filter';
import mtGroupBy from './cc-indicator-group-by';
import mtTable from './table';

const module = angular.module(
	'monitool.components.pages.indicator.reporting',
	[
		uiRouter, // for $stateProvider

		mtFilter.name,
		mtGroupBy.name,
		mtTable.name
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

		constructor($filter) {
			this._formatSlot = $filter('formatSlot');
			this._formatSlotRange = $filter('formatSlotRange');

			this.filter = this.groupBy = null
			this.graphX = [];
			this.graphYs = {};
		}

		onGroupByUpdate(groupBy) {
			this.groupBy = groupBy;

			if (this.filter)
				this._updateColumns();
		}

		onFilterUpdate(newFilter) {
			this.filter = newFilter;

			if (this.groupBy)
				this._updateColumns();
		}

		onPlotToggle(id, name, data) {
			const newGraphs = Object.assign({}, this.graphYs);

			if (data)
				newGraphs[id] = {name: name, data: data};
			else
				delete newGraphs[id];

			this.graphYs = newGraphs;
		}

		_updateColumns() {
			const [start, end] = [this.filter._start, this.filter._end];

			const slots = Array.from(
				timeSlotRange(
					TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), this.groupBy),
					TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), this.groupBy)
				)
			);

			this.columns = [
				...slots.map(slot => {
					return {
						id: slot.value,
						name: this._formatSlot(slot.value),
						title: this._formatSlotRange(slot.value)
					};
				}),
				{id:'_total', name: "Total"}
			];

			this.graphX = this.columns.filter(x => x.id !== '_total');
		}
	}
});

export default module;
