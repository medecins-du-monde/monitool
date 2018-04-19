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


	get structure() {
		return this.partitions.map(partition => {
			return {
				id: partition.id,
				items: partition.elements.map(pe => pe.id),
				aggregation: partition.aggregation
			};
		});
	}

	get rotatedPartitions() {
		let n = this.partitions.length,
			i = this.order;

		//////////
		// Compute of the n-th permutation of sequence range(i)
		//////////
		var j, k = 0,
			fact = [],
			perm = [];

		// compute factorial numbers
		fact[k] = 1;
		while (++k < n)
			fact[k] = fact[k - 1] * k;

		// compute factorial code
		for (k = 0; k < n; ++k) {
			perm[k] = i / fact[n - 1 - k] << 0;
			i = i % fact[n - 1 - k];
		}

		// readjust values to obtain the permutation
		// start from the end and check if preceding values are lower
		for (k = n - 1; k > 0; --k)
			for (j = k - 1; j >= 0; --j)
				if (perm[j] <= perm[k])
					perm[k]++;

		//////////
		// Map our partitions to the found permutation
		//////////
		return perm.map(index => this.partitions[index]);
	}

	getPdfDocDefinition() {
		var partitions = this.rotatedPartitions;

		var body, widths;

		var colPartitions = partitions.slice(this.distribution),
			rowPartitions = partitions.slice(0, this.distribution);

		var topRows = this._makeTopRows(colPartitions),
			bodyRows = this._makeLeftCols(rowPartitions);

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

	_makeTopRows(partitions) {
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

	_makeLeftCols(partitions) {
		let rows = this._makeTopRows(partitions);

		if (rows.length === 0)
			return [];

		var result = new Array(rows[0].length);

		for (var x = 0; x < rows[0].length; ++x) {
			result[x] = new Array(rows.length);

			for (var y = 0; y < rows.length; ++y) {
				result[x][y] = JSON.parse(JSON.stringify(rows[y][x]));

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
