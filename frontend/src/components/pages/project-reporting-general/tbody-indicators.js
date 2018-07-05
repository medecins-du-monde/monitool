

import angular from 'angular';
import uuid from 'uuid/v4';

import mtTrIndicator from '../../shared/reporting/tr-indicator';
import mtFaOpen from '../../shared/misc/plus-minus-icon';
import {generateIndicatorDimensions} from '../../../helpers/indicator';

const module = angular.module(
	'monitool.components.pages.project.reporting-general.indicators-tbody',
	[
		mtTrIndicator.name,
		mtFaOpen.name
	]
);


module.directive('tbodyIndicators', () => {
	return {
		controllerAs: '$ctrl',
		restrict: 'A',
		scope: {}, // Isolate

		bindToController: {
			columns: '<',
			filter: '<',
			groupBy: '<',
			project: '<',
			sections: '<',
			name: '<',
			prefix: '<',
			firstColStyle: '<',

			onPlotToggle: '&',
		},
		template: require('./tbody-indicators.html'),

		controller: class IndicatorsTbodyController {

			constructor() {
				this.open = false;
				this.splits = {};
			}

			$onChanges(changes) {
				if (changes.sections || changes.filter || changes.groupBy)
					this._makeRows();
			}

			onOpenToggle() {
				this.open = !this.open;
			}

			onSplitToggle(rowId, dimensionId) {
				this.splits[rowId] = this.splits[rowId] !== dimensionId ? dimensionId : null;
				this._makeRows();
			}

			_makeRows() {
				// Make the rows.
				this.rows = [];
				this.sections.forEach(section => {
					if (section.name)
						this.rows.push({id: uuid(), type: 'header', name: section.name, indent: section.indent});

					if (section.indicators.length)
						section.indicators.forEach(indicator => {
							this._makeRowsRec(indicator, indicator.display, false, this.filter, section.indent, indicator.id)
						});
					// else
					// 	this.rows.push({id: uuid(), type: 'no_indicators', indent: section.indent});
				});
			}

			_makeRowsRec(indicator, name, isGroup, filter, indent, rowId) {
				// Add the row to the table
				this.rows.push({
					id: rowId,
					type: 'indicator',
					name: name,
					isGroup: isGroup,
					indicator: indicator,
					filter: filter,
					indent: indent
				});

				// Recurse to append opened disagregations
				const dimensionId = this.splits[rowId];
				if (dimensionId) {
					const dimensions = generateIndicatorDimensions(this.project, indicator.computation)
						.filter(dim => !dim.exclude.includes(this.groupBy) && !dim.exclude.some(d => this.filter[d]));

					const dimension = dimensions.find(d => d.id === dimensionId);

					if (dimension) {
						dimension.rows.forEach(row => {
							const childFilter = Object.assign({}, filter);
							for (let key in row.filter) {
								if (childFilter[key])
									childFilter[key] = row.filter[key].filter(e => childFilter[key].includes(e));
								else
									childFilter[key] = row.filter[key];
							}

							this._makeRowsRec(
								indicator,
								row.name,
								row.isGroup,
								childFilter,
								indent + 1,
								rowId + '/' + dimension.id + '=' + row.id
							);
						});
					}
					else {
						this.splits[rowId] = null;
					}
				}
			}
		}
	};
});

export default module;

