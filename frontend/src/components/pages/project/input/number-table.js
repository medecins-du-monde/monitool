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

import {transpose2D, computeNthPermutation} from '../../../../helpers/array';

const module = angular.module(
	'monitool.components.ng-models.number-table',
	[
	]
);



const headerOptions = {
	readOnly: true,
	renderer: function(instance, td, row, col, prop, value, cellProperties) {
		Handsontable.renderers.TextRenderer.apply(this, arguments);
		td.style.color = 'black';
		td.style.background = '#eee';
	}
};

const dataOptions = {type: 'numeric', validator: /^\d+$/};

/** This is a slightly changed version of pdf-export.js, we should refactor this */
const makeRows = function(partitions) {
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

		// push to body
		body.push(row);
	});

	return body;
};

/**
 * Given the index of a field in a data vector, returns the index of the same field
 * if the partitions were permutated
 */
const permutateDataIndex = function(element, originalIndex) {
	// Compute the order in which the partition are permutated. We need that later.
	var permutation = computeNthPermutation(element.partitions.length, element.order);

	// Use divmod operations to know which elements originalIndex comes from.
	var originalIdxs = new Array(element.partitions.length);
	for (var i = element.partitions.length - 1; i >= 0; --i) {
		originalIdxs[i] = originalIndex % element.partitions[i].elements.length;
		originalIndex = Math.floor(originalIndex / element.partitions[i].elements.length);
	}

	// Compute the new index in the permutatedData table.
	var permutatedIndex = 0;
	for (var i = 0; i < element.partitions.length; ++i) {
		// i-th contribution is the contribution of partition[permutation[i]]
		var j = permutation[i];
		permutatedIndex = permutatedIndex * element.partitions[j].elements.length + originalIdxs[j];
	}

	return permutatedIndex;
};

/**
 * Permutate a complete data vector
 */
const permutateData = function(element, originalData) {
	var permutatedData = new Array(originalData.length);

	for (var originalIndex = 0; originalIndex < originalData.length; ++originalIndex) {
		var permutatedIndex = permutateDataIndex(element, originalIndex);
		permutatedData[permutatedIndex] = originalData[originalIndex];
	}

	return permutatedData;
};

/**
 * Unpermutate a complete data vector
 */
const unpermutateData = function(element, permutatedData) {
	var originalData = new Array(permutatedData.length);

	for (var originalIndex = 0; originalIndex < originalData.length; ++originalIndex) {
		var permutatedIndex = permutateDataIndex(element, originalIndex);
		originalData[originalIndex] = permutatedData[permutatedIndex];
	}

	return originalData;
};


module.component('inputGrid', {
	bindings: {
		element: '<'
	},
	require: 'ngModel',
	template: require('./number-table.html'),

	controller: function() {

		// Convert a 1D array with all the data to a 2D table with headers.
		ngModelController.$formatters.push(function(modelValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.element.partitions.length === 0)
				return [modelValue];

			// We need the permutation later on.
			var permutation = computeNthPermutation(this.element.partitions.length, this.element.order);

			var viewValue = [];

			// Start by creating the headers.
			var partitions = permutation.map(index => this.element.partitions[index]);

			var colPartitions = partitions.slice(this.element.distribution),
				rowPartitions = partitions.slice(0, this.element.distribution);

			var topRows = makeRows(colPartitions),
				bodyRows = transpose2D(makeRows(rowPartitions));

			if (!bodyRows.length)
				bodyRows.push([])

			var dataColsPerRow = topRows.length ? topRows[0].length : 1;

			// Add data fields to bodyRows
			var permutatedData = permutateData(this.element, modelValue)
			bodyRows.forEach(bodyRow => {
				bodyRow.push(...permutatedData.splice(0, dataColsPerRow));
			});

			// Add empty field in the top-left corner for topRows
			topRows.forEach((topRow, index) => {
				for (var i = 0; i < rowPartitions.length; ++i)
					topRow.unshift('');
			});

			return [...topRows, ...bodyRows];
		});

		ngModelController.$parsers.push(function(viewValue) {
			// Special case! Having no partition does not cause having zero data fields
			if (this.element.partitions.length === 0)
				return viewValue[0];

			var modelValue = [];
			for (var y = this.element.partitions.length - this.element.distribution; y < viewValue.length; ++y) {
				modelValue.push(...viewValue[y].slice(this.element.distribution));
			}

			return unpermutateData(this.element, modelValue);
		});

		// Renders the $viewValue to screen

		var hotTable = null;

		ngModelController.$render = function() {
			// hotTable was not created yet, let's do it now
			if (!hotTable) {
				hotTable = new Handsontable(element[0].firstElementChild, {
					// Use all width with columns all the same size
					stretchH: "all",
					colWidths: 'xxx',
				    className: "htLeft",

					// Lock grid size so that user can't expand it.
					maxRows: ngModelController.$viewValue.length,
					maxCols: ngModelController.$viewValue[0].length,

					// Pass data
					data: ngModelController.$viewValue,

					// processing to do when the UI table is updated.
					afterChange: function(changes, action) {
						// changes === undefined when action === "loadData"
						// @see http://docs.handsontable.com/0.15.0-beta3/Hooks.html#event:afterChange
						if (changes) {
							// if the data that was entered is a formula (eg: 1+2) replace by evaluated value.
							changes.forEach(change => {
								var x = change[0], y = change[1], val = change[3];

								if (typeof val != 'number') {
									try { hotTable.setDataAtCell(x, y, exprEval.Parser.evaluate(val, {})); }
									catch (e) { }
								}
							});

							// tell ngModelController that the data was changed from HandsOnTable.
							ngModelController.$setViewValue(hotTable.getData());
						}
					},

					cells: function(row, col, prop) {
						var isHeader = col < this.element.distribution || row < this.element.partitions.length - this.element.distribution;
						return isHeader ? headerOptions : dataOptions;
					}
				});
			}
			else {
				// Update HandsOnTable data. We do not need to clone the table.
				hotTable.loadData(ngModelController.$viewValue);
			}
		};
	}
});


export default module;

