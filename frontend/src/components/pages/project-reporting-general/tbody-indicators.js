

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
					this.rows.push(...this._makeSectionRows(section, this.filter))
				});
			}

			*_makeSectionRows(section, filter) {
				if (section.name)
					yield {id: uuid(), type: 'header', name: section.name, prefix: section.prefix, indent: section.indent};

				// if (section.indicators.length)
				for (let indicator of section.indicators)
					yield* this._makeSectionRowsRec(indicator, indicator.display, false, filter, section.indent, indicator.id)
				// else
				// 	yield {id: uuid(), type: 'no_indicators', indent: section.indent};
			}

			*_makeSectionRowsRec(indicator, name, isGroup, filter, indent, rowId) {
				// Add the row to the table
				yield {
					id: rowId,
					type: 'indicator',
					name: name,
					isGroup: isGroup,
					indicator: indicator,
					filter: filter,
					indent: indent
				};

				// Stop here is there is no disagregation open.
				const dimensionId = this.splits[rowId];
				if (!dimensionId)
					return;

				// Get the dimension we want to split on.
				const dimensions = generateIndicatorDimensions(this.project, indicator).filter(dim => {
					return !dim.exclude.includes(this.groupBy) && !dim.exclude.some(d => filter[d]);
				});

				const dimension = dimensions.find(d => d.id === dimensionId);

				// Stop here if we did not find it: we're folding this part of the tree.
				if (!dimension) {
					this.splits[rowId] = null;
					return;
				}

				// Recurse on the dimension rows to create the new lines.
				for (let row of dimension.rows) {
					// Merge our filter with the global one.
					const childFilter = Object.assign({}, filter);
					for (let key in row.filter) {
						if (childFilter[key])
							childFilter[key] = row.filter[key].filter(e => childFilter[key].includes(e));
						else
							childFilter[key] = row.filter[key];
					}

					// Recurse
					yield* this._makeSectionRowsRec(
						row.indicator,
						row.name,
						row.isGroup,
						childFilter,
						indent + 1,
						rowId + '/' + dimension.id + '=' + row.id
					);
				}
			}
		}
	};
});

export default module;

