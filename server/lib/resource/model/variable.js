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

import validator from 'is-my-json-valid';
import Model from './model';
import schema from '../schema/variable.json';
import arrayUtils from '../../utils/array';

const validate = validator(schema);

export default class Variable extends Model {

	constructor(data) {
		super(data, validate);
	}

	/**
	 * Signature that changes when the storage of this variable changes.
	 */
	get signature() {
		// the order of partition elements matters => to not sort!
		return JSON.stringify(
			this.partitions.map(function(partition) {
				return [partition.id].concat(
					partition.elements.map(function(partitionElement) {
						return partitionElement.id;
					})
				);
			})
		);
	}

	/**
	 * Number of fields this variable's storage.
	 */
	get numValues() {
		return this.partitions.reduce((m, p) => m * p.elements.length, 1);
	}

	getPdfDocDefinition() {
		var permutation = arrayUtils.computeNthPermutation(this.partitions.length, this.order),
			partitions = permutation.map(index => this.partitions[index]);

		var body, widths;

		var colPartitions = partitions.slice(this.distribution),
			rowPartitions = partitions.slice(0, this.distribution);

		var topRows = this._makeRows(colPartitions),
			bodyRows = arrayUtils.transpose2D(this._makeRows(rowPartitions));

		if (!bodyRows.length)
			bodyRows.push([])

		var dataColsPerRow = topRows.length ? topRows[0].length : 1;

		// Add empty data fields to bodyRows
		bodyRows.forEach(function(bodyRow) {
			for (var i = 0; i < dataColsPerRow; ++i)
				bodyRow.push(' ');
		});

		// Add empty field in the top-left corner for topRows
		topRows.forEach(function(topRow, index) {
			for (var i = 0; i < rowPartitions.length; ++i)
				topRow.unshift({
					text: ' ',
					colSpan: i == rowPartitions.length - 1 ? rowPartitions.length : 1,
					rowSpan: index == 0 ? topRows.length : 1
				});
		});

		body = topRows.concat(bodyRows);

		widths = [];
		for (var i = 0; i < rowPartitions.length; ++i)
			widths.push('auto');
		for (var j = 0; j < dataColsPerRow; ++j)
			widths.push('*');

		// Create stack with label and table.
		var result = {
			stack: [
				{style: "variableName", text: this.name},
				{
					table: {
						headerRows: colPartitions.length,
						dontBreakRows: true,
						widths: widths,
						body: body
					}
				}
			]
		};

		// FIXME This is not ideal at all, but the best that can be done with current pdfmake API.
		// if table is not very long, make sure it is not cut in the middle.
		if (body.length < 20)
			result = {
				layout: 'noBorders',
				table: {
					dontBreakRows: true,
					widths: ['*'],
					body: [[result]]
				}
			}

		return result;
	}

	_makeRows(partitions) {
		var totalCols = partitions.reduce(function(memo, tp) { return memo * tp.elements.length; }, 1),
			currentColSpan = totalCols;

		var body = [];

		// Create header rows for top partitions
		partitions.forEach(function(tp) {
			// Update currentColSpan
			currentColSpan /= tp.elements.length;

			// Create header row
			var row = [];

			// Add one field for each element in tp, with current colspan
			for (var colIndex = 0; colIndex < totalCols; ++colIndex) {
				// Add field
				var tpe = tp.elements[(colIndex / currentColSpan) % tp.elements.length];
				row.push({colSpan: currentColSpan, style: "normal", text: tpe.name});

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

}
