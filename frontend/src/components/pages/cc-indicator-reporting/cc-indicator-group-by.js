
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
			this.periodicities = this._computeCompatiblePeriodicities();
			this.groupBy = 'month';
			this.onValueChange();
		}

		onValueChange() {
			this.onUpdate({groupBy: this.groupBy});
		}

		_computeCompatiblePeriodicities() {
			const timePeriodicities = [
				'day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun',
				'week_mon', 'month', 'quarter', 'semester', 'year'
			];

			return timePeriodicities.filter(periodicity => {
				for (let j = 0; j < this.projects.length; ++j) {
					for (let i = 0; i < this.projects[j].forms.length; ++i) {
						const dataSource = this.projects[j].forms[i];

						if (dataSource.periodicity == 'free' || dataSource.periodicity === periodicity)
							return true;

						try {
							let t = TimeSlot.fromDate(new Date(), dataSource.periodicity);
							t.toUpperSlot(periodicity);
							return true;
						}
						catch (e) {
						}
					}
				}
			});
		}
	}
});

export default module;
