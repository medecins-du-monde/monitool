

import angular from 'angular';
import {generateIndicatorDimensions} from '../../../helpers/indicator';

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
				this._dimensions = generateIndicatorDimensions(this.project, this.indicator, {}).filter(dim => dim.id !== 'computation');
				this.selected = {rows: [this._dimensions[0].id], cols: []};

				this.onSelectUpdate();
			}
		}

		onSelectUpdate() {
			this._makeRowColsList();
			this.onUpdate({dimensions: this.selected});
		}

		_makeRowColsList() {
			const selectedDimensions = [...this.selected.rows, ...this.selected.cols];

			this.availableCols = this._dimensions.filter(dimension => {
				const usedOnOther = this.selected.rows.includes(dimension.id);
				const excluded = selectedDimensions.some(id => {
					const dim = this._dimensions.find(d => d.id === id);
					return dimension.id !== id && dim.exclude.includes(dimension.id);
				});

				return !usedOnOther && !excluded;
			});

			this.availableRows = this._dimensions.filter(dimension => {
				const usedOnOther = this.selected.cols.includes(dimension.id);
				const excluded = selectedDimensions.some(id => {
					const dim = this._dimensions.find(d => d.id === id);
					return dimension.id !== id && dim.exclude.includes(dimension.id);
				});

				return !usedOnOther && !excluded;
			});
		}
	}
});

export default module.name;
