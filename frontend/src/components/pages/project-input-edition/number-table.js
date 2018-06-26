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
import exprEval from 'expr-eval';
import Handsontable from 'handsontable/dist/handsontable.js';
import 'handsontable/dist/handsontable.css';


const module = angular.module(
	'monitool.components.ng-models.number-table',
	[
	]
);

/**
 * Warning: do not rebind variable after the component has initialized.
 * It is not watching the value.
 */
module.component('inputGrid', {
	bindings: {
		variable: '<'
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
			const withSum =
				this.variable.partitions.length > 0
				&& this.variable.partitions.every(p => p.aggregation === 'sum');

			this.withSumX = withSum && this.variable.distribution !== this.variable.partitions.length;
			this.withSumY = withSum && this.variable.distribution !== 0;

			const [colPartitions, rowPartitions] = [
				this.variable.partitions.slice(this.variable.distribution),
				this.variable.partitions.slice(0, this.variable.distribution)
			];

			this._width = colPartitions.reduce((m, p) => m * p.elements.length, 1) + rowPartitions.length + (this.withSumX ? 1 : 0);
			this._height = rowPartitions.reduce((m, p) => m * p.elements.length, 1) + colPartitions.length + (this.withSumY ? 1 : 0);

			this.handsOnTable = new Handsontable(this.$element[0].firstElementChild, {
				// Use all width with columns all the same size
				stretchH: "all",
				colWidths: 'xxx',
				className: "htLeft",

				// Lock grid size so that user can't expand it.
				maxCols: this._width,
				maxRows: this._height,

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
				const [y, x, _, val] = change;

				// If user entered something that is not a number, try to evaluate it with
				// the parser to see if it works.
				if (typeof val !== 'number') {
					try {
						const newValue = exprEval.Parser.evaluate(val, {});
						this.handsOnTable.setDataAtCell(y, x, newValue);
					}
					catch (e) {
					}
				}
				// If the user entered a number, update the totals on last columns and last row.
				else {
					this._updateSums(y, x)
				}
			});

			// tell this.ngModelCtrl that the data was changed from HandsOnTable.
			this.ngModelCtrl.$setViewValue(this.handsOnTable.getData());
		}

		/**
		 * Render header and content with different styles.
		 */
		_handsOnTableCellRenderer(row, col, prop) {
			const numPartitions = this.variable.partitions.length;

			// header
			if (col < this.variable.distribution || row < numPartitions - this.variable.distribution)
				return {
					readOnly: true,
					renderer: function(instance, td, row, col, prop, value, cellProperties) {
						Handsontable.renderers.TextRenderer.apply(this, arguments);
						td.style.color = 'black';
						td.style.background = '#eee';
					}
				};

			// total
			else if ((this.withSumX && col == this._width - 1) || (this.withSumY && row === this._height - 1))
				return {type: 'numeric', readOnly: true};

			// editable field
			else
				return {type: 'numeric', validator: /^\d+$/};
		}

		_updateSums(editedY, editedX) {
			const numPartitions = this.variable.partitions.length;
			let sum;

			// guard against infinite loop (the total update trigering another update etc...)
			if (this.withSumX && editedX < this._width - 1) {
				sum = 0;
				for (let x = this.variable.distribution; x < this._width - 1; ++x)
					sum += this.handsOnTable.getDataAtCell(editedY, x);
				this.handsOnTable.setDataAtCell(editedY, this._width - 1, sum);
			}

			if (this.withSumY && editedX < this._width - 1 && editedY < this._height - 1) {
				sum = 0;
				for (let y = numPartitions - this.variable.distribution; y < this._height - 1; ++y)
					sum += this.handsOnTable.getDataAtCell(y, editedX);
				this.handsOnTable.setDataAtCell(this._height - 1, editedX, sum);
			}
		}

		/**
		 * Convert input 1D table to handsontable 2D table with headers.
		 */
		_modelToView(modelValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.variable.partitions.length === 0)
				return [modelValue];

			// Clone modelValue to avoid detroying the original model
			modelValue = modelValue.slice();

			var viewValue = [];

			// Start by creating the headers.
			var colPartitions = this.variable.partitions.slice(this.variable.distribution),
				rowPartitions = this.variable.partitions.slice(0, this.variable.distribution);

			var topRows = this._makeHeaderRows(colPartitions);
			// super ugly hack so that _makeHeaderCols add the sum row only if relevant
			[this.withSumX, this.withSumY] = [this.withSumY, this.withSumX];

			var bodyRows = this._makeHeaderCols(rowPartitions);
			[this.withSumX, this.withSumY] = [this.withSumY, this.withSumX]; // restore variable to their proper values.

			// when distribution == 0, rowPartitions = [], and there is nowhere to enter the data.
			if (!bodyRows.length)
				bodyRows.push([])

			var dataColsPerRow = topRows.length ? topRows[0].length : 1;
			if (this.withSumX)
				dataColsPerRow -= 1;

			// Add data fields to bodyRows
			let accumulator;
			if (this.withSumY) {
				accumulator = new Array(dataColsPerRow);
				accumulator.fill(0);
			}

			bodyRows.forEach(bodyRow => {
				if (modelValue.length) {
					const data = modelValue.splice(0, dataColsPerRow)
					if (this.withSumX)
						data.push(data.reduce((m, e) => m + e, 0));

					bodyRow.push(...data);

					if (this.withSumY)
						for (var i = 0; i < dataColsPerRow; ++i)
							accumulator[i] += data[i];
				}
				else {
					if (!this.withSumY)
						throw new Error('should not happen');

					bodyRow.push(...accumulator)
					if (this.withSumX)
						bodyRow.push(accumulator.reduce((m, e) => m + e, 0))
				}
			});

			// Add empty field in the top-left corner for topRows
			topRows.forEach((topRow, index) => {
				for (var i = 0; i < rowPartitions.length; ++i)
					topRow.unshift('');
			});

			return [...topRows, ...bodyRows];
		}

		/**
		 * Convert 2D handsontable table with headers to 1D table that can be stored in input.
		 */
		_viewToModel(viewValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.variable.partitions.length === 0)
				return viewValue[0];

			const [minX, minY, maxX, maxY] = [
				this.variable.distribution,
				this.variable.partitions.length - this.variable.distribution,
				viewValue[0].length - (this.withSumX ? 1 : 0),
				viewValue.length - (this.withSumY ? 1 : 0),
			];

			var modelValue = [];
			for (var y = minY; y < maxY; ++y)
				modelValue.push(...viewValue[y].slice(minX, maxX));

			return modelValue;
		}

		/**
		 * Helper to create the rows of the 2D array used by hands on table.
		 * This is a slightly changed version of pdf-export.js from the server, we should refactor this
		 * to make it smaller.
		 */
		_makeHeaderRows(partitions) {
			var totalCols = partitions.reduce((memo, tp) => memo * tp.elements.length, 1),
				currentColSpan = totalCols;

			var body = [];

			// Create header rows for top partitions
			partitions.forEach(tp => {
				// Update currentColSpan
				currentColSpan /= tp.elements.length;

				// Create header row
				var row = [];

				// Add one field for each element in tp, with current colspan
				for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
					// Add field
					var tpe = tp.elements[(colIndex / currentColSpan) % tp.elements.length];
					row.push(tpe.name);

					// Add as many fillers as the colSpan value - 1
					var colLimit = colIndex + currentColSpan - 1;
					for (; colIndex < colLimit; ++colIndex)
						row.push("");
				}

				if (this.withSumX)
					row.push('Total');

				// push to body
				body.push(row);
			});

			return body;
		}

		/**
		 * Make the header columns on the left of the table.
		 * This function makes top rows, then rotate them.
		 */
		_makeHeaderCols(partitions) {
			const rows = this._makeHeaderRows(partitions);
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

