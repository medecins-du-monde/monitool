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


const module = angular.module(
	'monitool.components.shared.reporting.olap-grid',
	[
	]
);


module.directive('olapGrid', function() {
	return {
		restrict: 'E',
		scope: {
			unit: '=',
			colorization: '=',
			cols: '=',
			rows: '=',
			data: '='
		},
		template: require("./olap-grid.html"),

		link: function($scope, element) {

			$scope.$watch('[cols,rows,data]', function() {
				// Create empty grid.
				var grid = {header: [], body: []};

				// Create header rows.
				var totalCols = $scope.cols.reduce((memo, col) => memo * col.length, 1),
					colspan = totalCols, // current colspan is total number of columns.
					numCols = 1; // current numCols is 1.

				for (var i = 0; i < $scope.cols.length; ++i) {
					// adapt colspan and number of columns
					colspan /= $scope.cols[i].length;
					numCols *= $scope.cols[i].length;

					// Create header row
					var row = {colspan: colspan, cols: []};
					for (var k = 0; k < numCols; ++k)
						row.cols.push($scope.cols[i][k % $scope.cols[i].length]);

					grid.header.push(row);
				}

				// Create data rows.
				$scope.rowspans = [];
				var rowspan = $scope.rows.reduce((memo, row) => memo * row.length, 1);
				for (var i = 0; i < $scope.rows.length; ++i) {
					rowspan /= $scope.rows[i].length;
					$scope.rowspans[i] = rowspan;
				}

				product($scope.rows).forEach(headers => {
					grid.body.push({
						headerCols: headers,
						dataCols:
							product(
								[...$scope.cols, ...headers.map(a => [a])]
							).map(els => {
								try {
									var result = $scope.data;
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

				$scope.grid = grid;
			});
		}
	}
});

export default module;