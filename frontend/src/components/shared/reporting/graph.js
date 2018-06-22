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
import c3 from 'c3';
import 'c3/c3.min.css';


const module = angular.module(
	'monitool.components.shared.reporting.graph',
	[
	]
);

module.component('reportingGraph', {

	bindings: {
		x: '<',
		ys: '<',
		presentation: '<'
	},

	template: '<div style="overflow: hidden; text-align: center"></div>',

	controller: class GraphController {

		constructor($element) {
			this.element = $element[0];
			this._formattedYs = [];
		}

		$postLink() {
			this.chart = c3.generate({
				size: {
					height: 200
				},
				bindto: this.element,
				data: {
					x: 'x',
					columns: this._formattedYs,
					type: this.presentation
				},
				axis: {
					x: {
						type: "category",
						tick: {
							// fit: true,
							// count: 10
							// culling: {
							// 	max: 10
							// }
						}
					}
				}
			});
		}

		$onChanges(changes) {
			if (changes.x || changes.ys) {
				const formerData = this._formattedYs;
				this._formattedYs = this._format(this.x, this.ys);

				// Chart may not be initialized yet.
				if (this.chart)
					this.chart.load({
						columns: this._formattedYs,
						unload:
							formerData
								.map(d => d[0])
								.filter(d => this._formattedYs.every(e => e[0] !== d))
					});
			}

			if (changes.presentation && this.chart) {
				this.chart.transform(this.presentation);
			}
		}

		$onDestroy() {
			this.chart.destroy();
		}

		_format(x, ys) {
			// Format series according to what c3 is expecting.
			const result = [
				['x', ...x.map(x => x.name)],
				...Object.keys(ys).map(rowId => [
					ys[rowId].name,
					...this.x.map(x => Math.round(ys[rowId].data[x.id]) || null)
				])
			];

			// Remove duplicate names, c3 can't handle them.
			const taken = new Set();
			result.forEach(row => {
				if (taken.has(row[0])) {
					let i = 2;
					while (taken.has(row[0] + ' (' + i + ')'))
						i++;

					row[0] = row[0] + ' (' + i + ')';
				}

				taken.add(row[0]);
			});

			return result;
		}
	}
});

export default module;