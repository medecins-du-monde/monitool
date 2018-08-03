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
import {generateIndicatorDimensions} from '../../../helpers/indicator';
import {product} from '../../../helpers/array';

const module = angular.module(
	'monitool.components.shared.reporting.olap-grid',
	[
	]
);


module.component('olapGrid', {
	bindings: {
		project: '<',
		indicator: '<',
		dimensions: '<',
		filter: '<',
		data: '<'
	},

	template: require('./olap-grid.html'),

	controller: class OlapGridController {

		constructor($element, $scope) {
			this._element = angular.element($element);
			this.$scope = $scope;
		}

		$onInit() {
			this._binded = this._onScroll.bind(this);
			this._element.bind('scroll', this._binded);
		}

		$onDestroy() {
			this._element.unbind('scroll', this._binded);
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

		$onChanges(changes) {
			const dimensions = generateIndicatorDimensions(this.project, this.indicator, this.filter);

			const rows = this.dimensions.rows.map(id => dimensions.find(d => d.id == id).rows);
			const cols = this.dimensions.cols.map(id => dimensions.find(d => d.id == id).rows);

			if (!rows.length) {
				rows.push([]);
				this.data = {_total: this.data};
			}
			if (!cols.length) {
				cols.push([])
				for (let key in this.data)
					this.data[key] = {_total: this.data[key]}
			}

			rows.forEach(row => row.push({id: '_total', name: 'total', isGroup: true}));
			cols.forEach(col => col.push({id: '_total', name: 'total', isGroup: true}));

			// Create empty grid.
			this.grid = {header: [], body: []};

			// Create header rows.
			var totalCols = cols.reduce((memo, col) => memo * col.length, 1),
				colspan = totalCols, // current colspan is total number of columns.
				numCols = 1; // current numCols is 1.

			for (var i = 0; i < cols.length; ++i) {
				// adapt colspan and number of columns
				colspan /= cols[i].length;
				numCols *= cols[i].length;

				// Create header row
				var row = {colspan: colspan, cols: []};
				for (var k = 0; k < numCols; ++k)
					row.cols.push(cols[i][k % cols[i].length]);

				this.grid.header.push(row);
			}

			// Create data rows.
			this.rowspans = [];
			var rowspan = rows.reduce((memo, row) => memo * row.length, 1);
			for (var i = 0; i < rows.length; ++i) {
				rowspan /= rows[i].length;
				this.rowspans[i] = rowspan;
			}

			product(rows).forEach(headers => {
				this.grid.body.push({
					headerCols: headers,
					dataCols: product([...headers.map(a => [a]), ...cols]).map(els => {
						try {
							var result = this.data;
							var numEls = els.length;
							for (var i = 0 ; i < numEls; ++i)
								result = result[els[i].id];

							return result;
						}
						catch (e) {
							return undefined;
						}
					})
				});
			});
		}
	}
})

export default module;
