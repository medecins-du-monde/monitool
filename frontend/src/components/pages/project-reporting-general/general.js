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
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

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

	$stateProvider.state('main.project.reporting.general', {
		url: '/general',
		component: 'generalReporting',
	});
});


module.component('generalReporting', {
	bindings: {
		themes: '<',

		project: '<',
		ccIndicators: '<'
	},
	template: require('./general.html'),
	controller: class GeneralReportingController {

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
			const timeGroupBy = [
				'year', 'semester', 'quarter', 'month',
				'week_sat', 'week_sun', 'week_mon',
				'month_week_sat', 'month_week_sun', 'month_week_mon',
				'day'
			];

			if (timeGroupBy.includes(this.groupBy)) {
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

				this.graphType = 'line';
			}

			else if (this.groupBy === 'entity') {
				let entities = this.project.entities;
				if (this.filter.entity)
					entities = entities.filter(e => this.filter.entity.includes(e.id));

				this.columns = [...entities, {id: '_total', name: 'Total'}];
				this.graphType = 'bar';
			}

			else if (this.groupBy === 'group') {
				let groups = this.project.groups;
				if (this.filter.entity)
					groups = groups.filter(g => g.members.some(e => this.filter.entity.includes(e)));

				// keep groups that contain at least one of the entities we are filtering on.
				this.columns = groups;
				this.graphType = 'bar';
			}
			else
				throw new Error('Invalid groupBy: ' + this.groupBy)

			this.graphX = this.columns.filter(x => x.id !== '_total');
		}
	}
});


export default module;

