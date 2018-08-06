
import angular from 'angular';
import uuid from 'uuid/v4';

import {generateIndicatorDimensions} from '../../../helpers/indicator';

import mtTrIndicator from '../../shared/reporting/tr-indicator';

const module = angular.module(
	'monitool.components.pages.cc-indicator-reporting.table',
	[
		mtTrIndicator
	]
);


module.component('ccIndicatorTable', {

	bindings: {
		projects: '<',
		ccIndicator: '<',

		filter: '<',
		groupBy: '<',
		columns: '<',

		onPlotToggle: '&'
	},

	template: require('./table.html'),

	controller: class CcIndicatorTableController {

		constructor($rootScope, $element, $scope) {
			this._element = angular.element($element);
			this.$scope = $scope;
			this.language = $rootScope.language;

			this.splits = {};
		}

		$onInit() {
			this._binded = this._onScroll.bind(this);
			this._element.bind('scroll', this._binded);
		}

		$onChanges(changes) {
			if (changes.projects)
				this._makeRows();
		}

		$onDestroy() {
			this._element.unbind('scroll', this._binded);
		}


		onSplitToggle(rowId, dimensionId) {
			this.splits[rowId] = this.splits[rowId] !== dimensionId ? dimensionId : null;
			this._makeRows();
		}

		_onScroll() {
			this.headerStyle = {
				transform: 'translate(0, ' + this._element[0].scrollTop + 'px)'
			};

			this.firstColStyle = {
				transform: 'translate(' + this._element[0].scrollLeft + 'px)'
			};

			this.$scope.$apply();
		}

		_makeRows() {
			this.rows = [];
			const projects = this.projects.slice();
			projects.sort((p1, p2) => p1.country.localeCompare(p2.country));
			projects.forEach(p => this.rows.push(...this._projectToRows(p)));
		}

		*_projectToRows(project) {
			const rows = [];

			let indicator = project.crossCutting[this.ccIndicator._id];
			if (!indicator)
				indicator = {
					display: this.ccIndicator.name[this.language],
					colorization: false, baseline: null, target: null,
					computation: null
				};
			else
				indicator.display = this.ccIndicator.name[this.language];

			yield* this._projectToRowsRec(
				project,
				indicator,
				project.country + ' - ' + project.name,
				false,
				this.filter,
				0,
				project._id
			);
		}

		*_projectToRowsRec(project, indicator, name, isGroup, filter, indent, rowId) {
			yield {
				id: rowId,
				project: project,
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
			const dimensions = generateIndicatorDimensions(project, indicator, filter).filter(dim => {
				return !dim.exclude.includes(this.groupBy);
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
						childFilter[key] = row.filter[key].slice();

					// Dirty: This is a huge hack.
					// We want to make sure that the user won't be able to disagregate twice on the same thing using the "+"
					// buttons that are in the reporting table.
					// For instance, disagregate by site, and then open a site group again, because it never ends and duplicates data on the table.
					childFilter[key].final = true;
				}

				// Recurse
				yield* this._projectToRowsRec(
					project,
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
});

export default module.name;