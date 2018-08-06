
import angular from 'angular';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';


const module = angular.module(
	'monitool.components.pages.cc-indicator-reporting.cc-indicator-group-by',
	[
	]
);

module.component('ccIndicatorGroupBy', {

	bindings: {
		projects: '<',
		onUpdate: '&'
	},
	template: require('./cc-indicator-group-by.html'),

	controller: class GeneralGroupBy {

		$onChanges(changes) {
			this.periodicities = ['month', 'quarter', 'semester', 'year'];
			this.groupBy = 'quarter';
			this.onValueChange();
		}

		onValueChange() {
			this.onUpdate({groupBy: this.groupBy});
		}
	}
});

export default module.name;
