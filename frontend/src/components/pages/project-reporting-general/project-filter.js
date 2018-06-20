
import mtMselectWithGroups from '../../shared/ng-models/mselect-with-groups';

const module = angular.module(
	'monitool.component.page.project-reporting-general.project-filter',
	[
		mtMselectWithGroups.name
	]
);


module.component('projectFilter', {
	bindings: {
		project: '<',
		onUpdate: '&'
	},

	template: require('./project-filter.html'),

	controller: class ProjectFilterController {

		$onInit() {
			this.panelOpen = false;
		}

		$onChanges(changes) {
			this.filter = {
				entity: this.project.entities.map(e => e.id),
				_start: this.project.start,
				_end: this.project.end,
			};

			this.onFilterChange();
		}

		onFilterChange() {
			this.onUpdate({filter: angular.copy(this.filter)});
		}

	}
});


export default module;
