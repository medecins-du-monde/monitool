/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import angular from 'angular';

import {product} from '../../../helpers/array';

const module = angular.module(
	'monitool.components.shared.reporting.olap-grid',
	[
	]
);



[
	[
		'paludisme',
		'ira',
		'diarrhe'
	]

]



module.component('olapGrid', {
	bindings: {
		project: '<',
		filter: '<',
		dimensionIds: '<',
		data: '<'
	},

	controller: class OlapGridController {



		_makeDimensions() {
			return this.dimensionIds.map(dimensionId => {
				// Find definition of the columns in the project.
				let columns;
				if (dimensionId === 'entity') {
					columns = this.project.entities.filter(site => this.filter.entity.includes(site.id));
				}
				else if (dimensionId === 'group') {
					// keep groups that intersect with the filter.
					columns = this.project.groups.filter(group => {
						return group.members.some(siteId => this.filter.entity.includes(siteId));
					});
				}
				else if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(dimensionId)) {
					const dataSource = this.project.forms.find(dataSource => {
						return dataSource.elements.some(variable => variable.partitions.some(partition => partition.id === dimensionId));
					})

					const variable = dataSource.elements.find(variable => {
						return variable.partitions.some(partition => partition.id === dimensionId);
					});

					var partition = variable.partitions.find(partition => partition.id === dimensionId);

					return partition.elements.filter(pe => this.filter[partition.id].includes(pe.id));
				}
				else if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_g/.test(dimensionId)) {

				}
				else {

				}
			});
		}

		_makeGridArray(nested, dimensions) {
			let result = [nested];

			for (let dimension of dimensions) {
				result = result.map(obj => {
					return dimension.map(el => obj[el.id]);
				});

				result = result.reduce((m, e) => m.concat(e));
			}

			return result;
		}



	}
})







/**
 * Warning: do not rebind variable after the component has initialized.
 * It is not watching the value.
 */
module.component('inputGrid2', {
	bindings: {
		dimensions: '<',
		distribution: '<',
		readOnly: '<',
		data: '<',
	},
	require: {
		'ngModelCtrl' :'ngModel'
	},
	template: require('./number-table.html'),

	controller: class InputGridController {

		constructor($element) {
			this.$element = $element;
		}

		$onInit() {
			// Convert a 1D array with all the data to a 2D table with headers and back.
			this.ngModelCtrl.$formatters.push(this._modelToView.bind(this));
			this.ngModelCtrl.$parsers.push(this._viewToModel.bind(this));

			this.ngModelCtrl.$render = () => this.handsOnTable.loadData(this.ngModelCtrl.$viewValue);

			this.ngModelCtrl.$validators.isNumber = modelValue => modelValue.every(v => typeof v === 'number');
		}

		$postLink() {
			const [colDimensions, rowDimensions] = [
				this.dimensions.slice(this.distribution),
				this.dimensions.slice(0, this.distribution)
			];

			const [width, height] = [
				colDimensions.reduce((m, p) => m * p.length, 1) + rowDimensions.length,
				rowDimensions.reduce((m, p) => m * p.length, 1) + colDimensions.length
			];

			this.handsOnTable = new Handsontable(this.$element[0].firstElementChild, {
				// Use all width with columns all the same size
				stretchH: "all",
				colWidths: 'xxx',
				className: "htLeft",

				// Lock grid size so that user can't expand it.
				maxCols: width,
				maxRows: height,

				// processing to do when the UI table is updated.
				afterChange: this._onHandsOnTableChange.bind(this),
				cells: this._handsOnTableCellRenderer.bind(this)
			});
		}

		/**
		 * Update the viewvalue when handsontable report changes.
		 */
		_onHandsOnTableChange(changes, action) {
			// changes === undefined when action === "loadData"
			// @see http://docs.handsontable.com/0.15.0-beta3/Hooks.html#event:afterChange
			if (!changes)
				return;

			// if the data that was entered is a formula (eg: 1+2) replace by evaluated value.
			changes.forEach(change => {
				const [x, y, _, val] = change;

				if (typeof val !== 'number') {
					try {
						const newValue = exprEval.Parser.evaluate(val, {});
						this.handsOnTable.setDataAtCell(x, y, newValue);
					}
					catch (e) {
					}
				}
			});

			// tell this.ngModelCtrl that the data was changed from HandsOnTable.
			this.ngModelCtrl.$setViewValue(this.handsOnTable.getData());
		}

		/**
		 * Render header and content with different styles.
		 */
		_handsOnTableCellRenderer(row, col, prop) {
			const isHeader = col < this.distribution
				|| row < this.dimensions.length - this.distribution;

			if (isHeader)
				return {
					readOnly: true,
					renderer: function(instance, td, row, col, prop, value, cellProperties) {
						Handsontable.renderers.TextRenderer.apply(this, arguments);
						td.style.color = 'black';
						td.style.background = '#eee';
					}
				};
			else {
				if (this.readOnly)
					return {type: 'numeric', readOnly: true};
				else
					return {type: 'numeric', validator: /^\d+$/};
			}
		}

		/**
		 * Convert input 1D table to handsontable 2D table with headers.
		 */
		_modelToView(modelValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.dimensions.length === 0)
				return [modelValue];

			// Clone modelValue to avoid detroying the original model
			modelValue = modelValue.slice();

			var viewValue = [];

			// Start by creating the headers.
			var colDimensions = this.dimensions.slice(this.distribution),
				rowDimensions = this.dimensions.slice(0, this.distribution);

			var topRows = this._makeHeaderRows(colDimensions),
				bodyRows = this._makeHeaderCols(rowDimensions);

			if (!bodyRows.length)
				bodyRows.push([])

			var dataColsPerRow = topRows.length ? topRows[0].length : 1;

			// Add data fields to bodyRows
			bodyRows.forEach(bodyRow => {
				bodyRow.push(...modelValue.splice(0, dataColsPerRow));
			});

			// Add empty field in the top-left corner for topRows
			topRows.forEach((topRow, index) => {
				for (var i = 0; i < rowDimensions.length; ++i)
					topRow.unshift('');
			});

			return [...topRows, ...bodyRows];
		}

		/**
		 * Convert 2D handsontable table with headers to 1D table that can be stored in input.
		 */
		_viewToModel(viewValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.dimensions.length === 0)
				return viewValue[0];

			var modelValue = [];
			for (var y = this.dimensions.length - this.distribution; y < viewValue.length; ++y)
				modelValue.push(...viewValue[y].slice(this.distribution));

			return modelValue;
		}

		/**
		 * Helper to create the rows of the 2D array used by hands on table.
		 * This is a slightly changed version of pdf-export.js from the server, we should refactor this
		 * to make it smaller.
		 */
		_makeHeaderRows(dimensions) {
			var totalCols = dimensions.reduce((memo, tp) => memo * tp.length, 1),
				currentColSpan = totalCols;

			var body = [];

			// Create header rows for top dimensions
			dimensions.forEach(tp => {
				// Update currentColSpan
				currentColSpan /= tp.length;

				// Create header row
				var row = [];

				// Add one field for each element in tp, with current colspan
				for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
					// Add field
					var tpe = tp[(colIndex / currentColSpan) % tp.length];
					row.push(tpe.name);

					// Add as many fillers as the colSpan value - 1
					var colLimit = colIndex + currentColSpan - 1;
					for (; colIndex < colLimit; ++colIndex)
						row.push("");
				}

				// push to body
				body.push(row);
			});

			return body;
		}

		/**
		 * Make the header columns on the left of the table.
		 * This function makes top rows, then rotate them.
		 */
		_makeHeaderCols(dimensions) {
			const rows = this._makeHeaderRows(dimensions);
			if (rows.length === 0)
				return [];

			var result = new Array(rows[0].length);

			for (var x = 0; x < rows[0].length; ++x) {
				result[x] = new Array(rows.length);

				for (var y = 0; y < rows.length; ++y) {
					result[x][y] = angular.copy(rows[y][x]);

					if (result[x][y].colSpan) {
						result[x][y].rowSpan = result[x][y].colSpan;
						delete result[x][y].colSpan;
					}
					else if (result[x][y].rowSpan) {
						result[x][y].colSpan = result[x][y].rowSpan;
						delete result[x][y].rowSpan;
					}
				}
			}

			return result;
		}
	}
});







export default module;
