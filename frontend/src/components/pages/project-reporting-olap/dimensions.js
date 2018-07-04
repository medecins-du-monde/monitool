

import angular from 'angular';
import {computeCompatiblePeriodicities, computeSplitPartitions} from '../../../helpers/indicator';

const module = angular.module(
	'monitool.components.pages.project-reporting-olap.dimensions',
	[
	]
);

module.component('olapDimensions', {

	bindings: {
		project: '<',
		indicator: '<',

		onUpdate: '&'
	},

	template: require('./dimensions.html'),

	controller: class OlapDimensionsController {

		$onChanges(changes) {
			if (changes.project || changes.indicator) {
				[this._dimensions, this._exclusions] = this._makeDimensionList();
				this.selected = {rows: [this._dimensions[0].id], cols: []};

				this.onSelectUpdate();
			}
		}

		onSelectUpdate() {
			this._makeRowColsList();
			this.onUpdate({dimensions: this.selected});
		}

		_makeDimensionList() {
			const dimensions = [];
			const exclusions = {};

			// Sites
			dimensions.push({id: 'entity', name: 'project.dimensions.entity'});
			dimensions.push({id: 'group', name: 'project.dimensions.group'});
			exclusions['entity'] = ['group'];
			exclusions['group'] = ['entity']

			const timePeriodicities = computeCompatiblePeriodicities(this.project, this.indicator.computation);

			timePeriodicities.forEach(periodicity => {
				dimensions.push({id: periodicity, name: 'project.dimensions.' + periodicity});
				exclusions[periodicity] = timePeriodicities.filter(p => p !== periodicity);
			});

			// Partitions
			computeSplitPartitions(this.project, this.indicator.computation).forEach(partition => {
				dimensions.push({id: partition.id, name: partition.name});
				if (partition.groups.length) {
					dimensions.push({id: partition.id + '_g', name: partition.name + '_groups'});
					exclusions[partition.id] = [partition.id + '_g'];
					exclusions[partition.id + '_g'] = [partition.id];
				}
				else
					exclusions[partition.id] = [];
			});

			return [dimensions, exclusions];
		}

		_makeRowColsList() {
			const selectedDimensions = [...this.selected.rows, ...this.selected.cols];

			this.availableCols = this._dimensions.filter(dimension => {
				const usedOnOther = this.selected.rows.includes(dimension.id);
				const excluded = selectedDimensions.some(id => this._exclusions[id].includes(dimension.id));
				return !usedOnOther && !excluded;
			});

			this.availableRows = this._dimensions.filter(dimension => {
				const usedOnOther = this.selected.cols.includes(dimension.id);
				const excluded = selectedDimensions.some(id => this._exclusions[id].includes(dimension.id));
				return !usedOnOther && !excluded;
			});
		}
	}
});

export default module;
