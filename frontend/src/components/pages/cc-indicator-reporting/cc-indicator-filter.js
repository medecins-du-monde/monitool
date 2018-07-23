
import mtMselectWithGroups from '../../shared/ng-models/mselect-with-groups';

const module = angular.module(
	'monitool.components.pages.cc-indicator-reporting.cc-indicator-filter',
	[
		mtMselectWithGroups.name
	]
);


module.component('ccIndicatorFilter', {
	bindings: {
		onUpdate: '&'
	},

	template: require('./cc-indicator-filter.html'),

	controller: class ProjectFilterController {

		$onInit() {
			this.panelOpen = false;
		}

		$onChanges(changes) {
			const now = new Date().toISOString().substring(0, 10);
			const start = (now.substring(0, 4) - 1).toString() + now.substring(4);
			this.filter = {_start: start, _end: now};

			this.onFilterChange();
		}

		onFilterChange() {
			this.onUpdate({filter: Object.assign({}, this.filter)});
		}
	}
});


export default module;
