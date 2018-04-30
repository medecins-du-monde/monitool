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

import uiRouter from '@uirouter/angularjs';

import mtThemeModel from '../../../services/models/theme';
import mtIndicatorModel from '../../../services/models/theme';
import mtProjectModel from '../../../services/models/theme';
import mtOlap from '../../../services/statistics/olap';
import mtReporting from '../../../services/statistics/reporting';


const module = angular.module(
	'monitool.pages.indicator.reporting',
	[
		uiRouter, // for $stateProvider

		mtThemeModel.name,
		mtIndicatorModel.name,
		mtProjectModel.name,
		mtOlap.name,
		mtReporting.name,
	]
);



module.config(function($stateProvider) {

	if (window.user.type == 'user') {
		$stateProvider.state('main.indicator_reporting', {
			url: '/indicator/:indicatorId',
			template: require('./reporting.html'),
			controller: 'IndicatorReportingController',
			resolve: {
				themes: function(Theme) {
					return Theme.query().$promise;
				},
				indicator: function(Indicator, $q, $stateParams) {
					return Indicator.get({id: $stateParams.indicatorId}).$promise;
				},
				projects: function(Project, indicator) {
					return Project.query({mode: 'crossCutting', indicatorId: indicator._id});
				},
				cubes: function(Cube, indicator) {
					return Cube.fetchIndicator(indicator._id);
				}
			}
		});
	}
});


module.controller('IndicatorReportingController', function($scope, Cube, mtReporting, indicator, projects, cubes, themes) {
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

export default module;