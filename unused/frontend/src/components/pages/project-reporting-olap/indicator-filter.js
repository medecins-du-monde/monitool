
import mtMselectWithGroups from '../../shared/ng-models/mselect-with-groups';
import {computeSplitPartitions} from '../../../helpers/indicator';

const module = angular.module(
	'monitool.component.shared.reporting.project-filter',
	[
		mtMselectWithGroups
	]
);


module.component('indicatorFilter', {
	bindings: {
		project: '<',
		logicalFramework: '<',
		indicator: '<',
		onUpdate: '&'
	},

	template: require('./indicator-filter.html'),

	controller: class IndicatorFilterController {

		$onInit() {
			this.panelOpen = false;
		}

		$onChanges(changes) {
			if (changes.project || changes.indicator) {
				this._computeBounds();
				this.partitions = computeSplitPartitions(this.project, this.indicator.computation);

				// By default filter takes every possible input.
				this.filter = {
					_start: this.minDate,
					_end: this.maxDate,
					entity: this.availableSites.map(site => site.id)
				};

				this.partitions.forEach(partition => {
					this.filter[partition.id] = partition.elements.map(e => e.id);
				});
			}

			this.onFilterChange();
		}

		_computeBounds() {
			this.minDate = this.project.start;
			this.maxDate = this.project.end;
			this.availableSites = this.project.entities;

			// Limit bounds against data sources.
			if (this.indicator.computation) {
				Object.values(this.indicator.computation.parameters).forEach(param => {
					const dataSource = this.project.forms.find(ds => {
						return ds.elements.some(variable => variable.id === param.elementId)
					});

					// The list of available entities is the intersection of the entities for the different variables.
					this.availableSites = this.availableSites.filter(site => dataSource.entities.includes(site.id));

					// Same for the dates.
					if (dataSource.start && this.minDate < dataSource.start)
						this.minDate = dataSource.start;
					if (dataSource.end && this.maxDate > dataSource.end)
						this.maxDate = dataSource.end;
				});
			}

			// Limit bounds against logical frame, if provided (not the case for extraIndicators, cc...)
			if (this.logicalFramework) {
				if (this.logicalFramework.start && this.minDate < this.logicalFramework.start)
					this.minDate = this.logicalFramework.start;
				if (this.logicalFramework.end && this.maxDate > this.logicalFramework.end)
					this.maxDate = dataSource.end;

				this.availableSites = this.availableSites.filter(site => this.logicalFramework.entities.includes(site.id));
			}

			this.availableGroups = this.project.groups
				.map(group => {
					const newGroup = angular.copy(group);

					// Compute intersection, and keep the same ordering than the sites specified
					// by the project's owners.
					newGroup.members = this.availableSites
						.filter(site => group.members.includes(site.id))
						.map(site => site.id);

					return newGroup;
				})
				.filter(group => !!group.members.length);
		}

		onFilterChange() {
			this.onUpdate({filter: angular.copy(this.filter)});
		}

	}
});


export default module.name;
