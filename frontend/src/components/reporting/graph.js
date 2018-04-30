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
	'monitool.components.reporting.graph',
	[
	]
);


module.directive('reportingGraphAdapter', function() {
	return {
		restrict: 'AE',
		scope: {
			cols: '=',
			originalRows: '=rows',
			plots: '=',
			type: '='
		},
		template: '<reporting-graph type="type" data="data"></reporting-graph>',
		link: function($scope, element, attributes, controller) {
			// there is no need to subscribe to $destroy
			// $scope will be destroyed with the directive.

			$scope.$watch('[plots, originalRows]', function() {
				if (!$scope.originalRows)
					return;

				$scope.data = {
					cols: $scope.cols,
					rows: angular.copy($scope.originalRows).filter(function(row) {
						return $scope.plots[row.id] && row.type == 'data' && row.cols;
					})
				};
			}, true);
		}
	};
});


module.directive('reportingGraph', function($rootScope) {
	// This helper function allow us to get the data without totals.
	var getStatsWithoutTotal = function(stats) {
		var totalIndex = stats.cols.findIndex(function(e) { return e.id === '_total' });

		if (totalIndex !== -1) {
			var newStats = angular.copy(stats);
			newStats.rows.forEach(function(row) { row.cols.splice(totalIndex, 1); });
			newStats.cols.splice(totalIndex, 1);
		}

		return newStats || stats;
	};

	return {
		restrict: 'AE',
		template: '<div style="overflow: hidden; text-align: center"></div>',
		scope: {
			'data': '=',
			'type': '='
		},
		link: function($scope, element, attributes, controller) {
			var chartId = 'chart_' + Math.random().toString().substring(2);

			element.children().attr('id', chartId);

			// Generate chart one time, when element is created.
			var chart = c3.generate({
				size: { height: 200 },
				bindto: '#' + chartId,
				data: {x: 'x', columns: []},
				axis: {
					x: {type: "category"}
				}
			});

			// Watch all scope parameters that could make the graph to change
			var unwatch = $scope.$watch('data', function(newStats, oldStats) {
				// leave if we are loading and stats is not defined yet.
				if (newStats) {
					// Retrieve stats + list rows that we want, and those that exit the current graph
					var stats = getStatsWithoutTotal(newStats);

					// Create Y series
					var xSerie  = ['x'].concat(stats.cols.map(function(e) { return e.name; })),
						ySeries = stats.rows.map(function(row) {
							var values = row.cols.map(function(v) { return v === undefined ? null : v; });

							return [row.fullname].concat(values);
						});

					// compute which rows are leaving.
					var exitingRowNames = [];
					if (oldStats)
						exitingRowNames = oldStats.rows.filter(function(oldRow) {
							return !stats.rows.find(function(newRow) { return newRow.fullname === oldRow.fullname; });
						}).map(function(row) {
							return row.fullname;
						});

					chart.load({ type: $scope.type, unload: exitingRowNames, columns: [xSerie].concat(ySeries) });
				}
			}, true);

			// cleanup when done
			// FIXME shouldn't this be an event on the scope?
			element.on('$destroy', function() {
				chart.destroy();
				unwatch();
			});
		}
	}
});


export default module;