

import angular from 'angular';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

import mtSelectIndicator from '../../shared/reporting/select-indicator';

import mtIndicatorFilter from '../../shared/reporting/indicator-filter';
import mtIndicatorGroupBy from '../../shared/reporting/indicator-group-by';
import mtIndicatorUnit from '../../../filters/indicator';
import mtTableIndicator from './table-indicator';

const module = angular.module(
	'monitool.components.pages.project.reporting-detailed',
	[
		mtSelectIndicator.name,
		mtIndicatorFilter.name,
		mtIndicatorGroupBy.name,
		mtIndicatorUnit.name,
		mtTableIndicator.name
	]
);


module.config($stateProvider => {

	$stateProvider.state('main.project.reporting.detailed', {
		url: '/detailed',
		component: 'detailedReporting'
	});

});


module.component('detailedReporting', {
	bindings: {
		project: '<',
		ccIndicators: '<'
	},
	template: require('./detailed.html'),

	controller: class DetailedReportingController {

		constructor($filter) {
			this._formatSlot = $filter('formatSlot');

			this.filter = this.groupBy = null
			this.graphX = [];
			this.graphYs = {};
		}

		onIndicatorUpdated(indicator, logicalFramework) {
			this.indicator = indicator;
		}

		onFilterUpdated(filter) {
			this.filter = filter;

			if (this.groupBy)
				this._updateColumns();
		}

		onGroupByUpdated(groupBy) {
			this.groupBy = groupBy;

			if (this.filter)
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
			if (!this.groupBy)
				this.slots = [];

			else
				this.slots = Array.from(timeSlotRange(
					TimeSlot.fromDate(new Date(this.filter._start + 'T00:00:00Z'), this.groupBy),
					TimeSlot.fromDate(new Date(this.filter._end + 'T00:00:00Z'), this.groupBy)
				)).map(s => s.value);

			this.graphX = this.slots.map(slot => {
				return {id: slot, name: this._formatSlot(slot)};
			});
		}
	}
});


export default module;

