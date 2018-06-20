
import angular from 'angular';
import axios from 'axios';

import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import {fetchData} from '../../../helpers/indicator';
import trIndicatorDetailed from './tr-indicator';

const module = angular.module(
	'monitool.components.pages.project-reporting-detailed.table-indicator',
	[
		trIndicatorDetailed.name,
	]
);


module.component('tableIndicator', {
	bindings: {
		project: '<',
		filter: '<',
		groupBy: '<',
		indicator: '<',

		onGraphToggle: '&'
	},
	template: require('./table-indicator.html'),
	controller: class IndicatorTableController {

		constructor($scope, $timeout) {
			this.$scope = $scope;
			this.$timeout = $timeout;
		}

		$onChanges(changes) {
			// Update different parts of the interface depending on what has changed.
			// premature optimisation warning: we could refresh everything for any changes
			if (changes.groupBy || changes.filter)
				this.columns = this._computeColumns();

			if (changes.project || changes.filter) {
				this.sites = this.project.entities.filter(site => this.filter.entity.includes(site.id));
				this.groups = this.project.groups.filter(group => {
					return group.members.some(id => this.filter.entity.includes(id))
				});
			}

			if (changes.project || changes.groupBy || changes.filter || changes.indicator) {
				if (!this._fetchDataWaiting) {
					this._fetchDataWaiting = true;
					this.errorMessage = 'shared.loading';
					this.values = null;
					this.$timeout(this._fetchData.bind(this), 100);
				}
			}
		}

		_computeColumns() {
			if (!this.groupBy) {
				this.slots = [];
				return;
			}

			this.slots = Array.from(
				timeSlotRange(
					TimeSlot.fromDate(new Date(this.filter._start + 'T00:00:00Z'), this.groupBy),
					TimeSlot.fromDate(new Date(this.filter._end + 'T00:00:00Z'), this.groupBy)
				)
			).map(s => s.value);
		}

		async _fetchData() {
			this._fetchDataWaiting = false;

			try {
				const data = await fetchData(
					this.project,
					this.indicator.computation,
					['entity', this.groupBy],
					this.filter,
					true,
					true
				);

				console.log(data)

				this.errorMessage = null;
				this.values = {};
				for (let key in data) {
					this.values[key] = this.slots.map(slot => data[key][slot])
					this.values[key].push(data[key]._total)
				}
			}
			catch (e) {
				this.errorMessage = 'reporting.failed';
			}

			this.$scope.$apply();
		}
	}
});


export default module;
