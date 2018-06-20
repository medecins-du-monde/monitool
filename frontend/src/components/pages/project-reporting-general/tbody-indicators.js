

import angular from 'angular';

import mtTrIndicator from '../../shared/reporting/tr-indicator';
import mtFaOpen from '../../shared/misc/plus-minus-icon';

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
			indicators: '<',
			name: '<',
			prefix: '<',

			onPlotToggle: '&',
		},
		template: require('./tbody-indicators.html'),

		controller: class IndicatorsTbodyController {

			constructor() {
				this.open = false;
				this.splits = {};
			}

			$onChanges(changes) {
				if (changes.indicators || changes.filter || changes.groupBy)
					this._makeRows();
			}

			onOpenToggle() {
				this.open = !this.open;
			}

			onSplitToggle(rowId, partitionId) {
				this.splits[rowId] = this.splits[rowId] !== partitionId ? partitionId : null;
				this._makeRows();
			}

			_makeRows() {
				// Make the rows.
				this.rows = [];
				this.indicators.forEach(indicator => this._makeRowsRec(indicator, this.filter));
			}

			_makeRowsRec(indicator, filter) {
				const partitions = this.project.forms
					.reduce((m, e) => m.concat(e.elements), [])
					.reduce((m, e) => m.concat(e.partitions), []);

				// Compute id for this row "variableId[partitionId=partitionElementId][...]"
				let rowId = indicator.id;
				for (let filterKey in filter) {
					const partition = partitions.find(p => p.id === filterKey);
					if (partition)
						rowId += '[' + filterKey + '=' + filter[filterKey] + ']';
				}

				// Add the row to the table
				this.rows.push({
					id: rowId,
					indicator: indicator,
					filter: filter,
					indent: Object.keys(filter).length - 3
				});

				// Recurse to append opened disagregations
				const partitionId = this.splits[rowId];
				if (partitionId) {
					const partition = partitions.find(p => p.id === partitionId);

					partition.groups.forEach(pg => {
						const childFilter = angular.copy(filter);
						childFilter[partition.id] = pg.members;
						this._makeRowsRec(indicator, childFilter);
					});

					partition.elements.forEach(pe => {
						const childFilter = angular.copy(filter);
						childFilter[partition.id] = [pe.id];
						this._makeRowsRec(indicator, childFilter);
					});
				}
			}
		}
	};
});

export default module;

