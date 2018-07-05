
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
			const myFilter = angular.copy(this.filter);
			if (myFilter.entity.length === this.project.entities.length)
				delete myFilter.entity;

			this.onUpdate({filter: myFilter});
		}
	}
});


export default module;
