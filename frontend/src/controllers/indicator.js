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

"use strict";

angular
	.module(
		'monitool.controllers.indicator',
		[
			'monitool.services.utils.translate',
		]
	)

	.controller('IndicatorListController', function($scope, indicators, themes) {

		$scope.themes = [];

		var noThematicsIndicators = indicators.filter(function(indicator) {
			return indicator.themes.length == 0;
		});
		if (noThematicsIndicators.length)
			$scope.themes.push({definition: null, translate: 'zero_theme_indicator', indicators: noThematicsIndicators});

		// Create a category with indicators that match project on 2 thematics or more
		var manyThematicsIndicators = indicators.filter(function(indicator) {
			return indicator.themes.length > 1;
		});
		if (manyThematicsIndicators.length)
			$scope.themes.push({definition: null, translate: 'multi_theme_indicator', indicators: manyThematicsIndicators});

		// Create a category with indicators that match project on exactly 1 thematic
		themes.forEach(function(theme) {
			var themeIndicators = indicators.filter(function(indicator) {
				return indicator.themes.length === 1 && indicator.themes[0] === theme._id;
			});

			if (themeIndicators.length !== 0)
				$scope.themes.push({definition: theme, indicators: themeIndicators});
		});

		// This getter will be used by the orderBy directive to sort indicators in the partial.
		$scope.getName = function(indicator) {
			return indicator.name[$scope.language];
		};
	})

	.controller('IndicatorReportingController', function($scope, Cube, mtReporting, indicator, projects, cubes, themes) {
		$scope.themes = themes;
		$scope.indicator = indicator;
		$scope.open = {};
		$scope.plots = {};
		$scope.filters = {_location: "none", _start: '9999-01-01', _end: '0000-01-01'};
		for (var i = 0; i < projects.length; ++i) {
			if (projects[i].start < $scope.filters._start)
				$scope.filters._start = projects[i].start;
			if (projects[i].end > $scope.filters._end)
				$scope.filters._end = projects[i].end;
		}

		// default group by
		if (mtReporting.getColumns('month', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'quarter';
		else if (mtReporting.getColumns('semester', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'semester';
		else
			$scope.groupBy = 'year';

		$scope.blocks = projects.map(function(project) {
			return {text: project.name + " (" + project.country + ')', project: project};
		});

		$scope.$watch('[filters, groupBy, splits, open]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end, null, null)

			$scope.blocks.forEach(function(block, index) {
				var fakeInd = block.project.crossCutting[indicator._id];
				var c = {};
				cubes[projects[index]._id].forEach(function(a) { c[a.id] = a; });

				block.rows = $scope.open[index] ?
					mtReporting.computeIndicatorReporting(c, projects[index], fakeInd, $scope.groupBy, $scope.filters) :
					null;
			});

			// Work around graph bug
			$scope.rows = [];
			$scope.blocks.forEach(function(block) { if (block.rows) $scope.rows = $scope.rows.concat(block.rows); });
		}, true);

	});

