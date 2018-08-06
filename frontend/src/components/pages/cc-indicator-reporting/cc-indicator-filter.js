
import mtMselectWithGroups from '../../shared/ng-models/mselect-with-groups';

const module = angular.module(
	'monitool.components.pages.cc-indicator-reporting.cc-indicator-filter',
	[
		mtMselectWithGroups
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
			const currentYear = new Date().getFullYear();
			this.filter = {
				_start: (currentYear - 1) + '-01-01',
				_end: currentYear + '-12-31',
				_showFinished: false
			};

			this.onFilterChange();
		}

		onFilterChange() {
			this.onUpdate({filter: Object.assign({}, this.filter)});
		}
	}
});


export default module.name;
