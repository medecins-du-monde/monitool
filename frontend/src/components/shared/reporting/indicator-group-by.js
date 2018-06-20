
import angular from 'angular';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import {computeCompatiblePeriodicities} from '../../../helpers/indicator';

const module = angular.module(
	'monitool.components.shared.reporting.indicator-group-by',
	[
	]
);



module.component('indicatorGroupBy', {

	bindings: {
		project: '<',
		indicator: '<',
		onUpdate: '&'
	},
	template: require('./indicator-group-by.html'),

	controller: class IndicatorGroupBy {

		$onChanges(changes) {
			this.periodicities = computeCompatiblePeriodicities(this.project, this.indicator.computation);
			this.groupBy = this._chooseDefaultGroupBy();
			this.onValueChange();
		}

		onValueChange() {
			this.onUpdate({groupBy: this.groupBy});
		}

		_chooseDefaultGroupBy() {
			let start = new Date(this.project.start + 'T00:00:00Z');
			let end = new Date(this.project.end + 'T00:00:00Z');
			let now = new Date();
			if (now < end)
				end = now;

			let chosen = this.periodicities[this.periodicities.length - 1];

			for (var i = 0; i < this.periodicities.length; ++i) {
				let iterator = timeSlotRange(
					TimeSlot.fromDate(start, this.periodicities[i]),
					TimeSlot.fromDate(end, this.periodicities[i])
				);

				if ([...iterator].length < 15) {
					chosen = this.periodicities[i];
					break;
				}
			}

			return chosen;
		}

	}
});

export default module;