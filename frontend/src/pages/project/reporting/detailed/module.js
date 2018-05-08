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

import mtComponentIndicatorSelect from '../../../../components/reporting/indicator-select';

const module = angular.module(
	'monitool.pages.project.reporting.detailed',
	[
		uiRouter, // for $stateProvider
		mtComponentIndicatorSelect.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.reporting.detailed', {
		url: '/detailed',
		template: require('./reporting-detailed.html'),
		controller: 'ProjectDetailedReportingController'
	});

});


module.controller('ProjectDetailedReportingController', function($scope, $filter, mtReporting, indicators) {
	// Initialization code
	$scope.plots = {};
	$scope.indicators = indicators;

	////////////////////////////////////////////////////
	// Each time the element is changed, initialize the query object.
	////////////////////////////////////////////////////
	$scope.onChosenElementUpdate = function(element) {

		////////////////////////////////////////
		// Create default query for this elementId
		////////////////////////////////////////

		var now = new Date().toISOString().substring(0, 10);
		var filters = {
			_start: $scope.masterProject.start,
			_end: now < $scope.masterProject.end ? now : $scope.masterProject.end
		};

		// Hack: Same as a bit lower: change the default dates when chosing an indicator from a logicalframework
		// This depends on another hack inserted in services/models/project.js:getAllIndicators()
		if (typeof element.logicalFrameIndex === 'number') {
			var lfStart = $scope.masterProject.logicalFrames[element.logicalFrameIndex].start;
			var lfEnd = $scope.masterProject.logicalFrames[element.logicalFrameIndex].end;
			if (lfStart && filters._start < lfStart)
				filters._start = lfStart;
			if (lfEnd && lfEnd < filters._end)
				filters._end = lfEnd;
		}

		// default group by
		var groupBy;
		if (mtReporting.getColumns('month', filters._start, filters._end).length < 15)
			groupBy = 'month';
		else if (mtReporting.getColumns('quarter', filters._start, filters._end).length < 15)
			groupBy = 'quarter';
		else if (mtReporting.getColumns('semester', filters._start, filters._end).length < 15)
			groupBy = 'semester';
		else
			groupBy = 'year';

		// extra filters if variable is selected.
		if (element.type == 'variable') {

			element.element.partitions.forEach(partition => {
				filters[partition.id] = partition.elements.map(pe => pe.id);
			});

			// filters
			$scope.dimensions = element.element.partitions;

			// make default query.
			$scope.query = {type: 'variable', element: element.element, filters: filters, groupBy: groupBy};
		}
		else {
			$scope.dimensions = [];

			// Hack: we copy logical frame index to the element, to be able to pass it to mtReporting.
			// It was written in there initially in services/models/project.js:getAllIndicators()
			// This is done to be able to fix #54 & #80: adding dates to logical frameworks.
			var ind = angular.copy(element.indicator);
			ind.logicalFrameIndex = element.logicalFrameIndex;
			$scope.query = {type: 'indicator', indicator: ind, filters: filters, groupBy: groupBy};
		}
	};

	$scope.$watch('cubes', function(cubes) {
		if (!cubes)
			return;

		////////////////////////////////////////////////////
		// The query object contains everything that is needed to compute the final table.
		// When it changes, we need to update the results.
		////////////////////////////////////////////////////

		$scope.$watch('query', function(query) {
			$scope.cols = mtReporting.getColumns($scope.query.groupBy, $scope.query.filters._start, $scope.query.filters._end);

			if (query.type == 'variable') {
				$scope.rows = mtReporting.computeVariableReporting(cubes, $scope.masterProject, $scope.query.element, $scope.query.groupBy, $scope.query.filters);

				$scope.baseline = null;
				$scope.target = null;
				$scope.unit = null;
			}
			else {
				$scope.rows = mtReporting.computeIndicatorReporting(cubes, $scope.masterProject, $scope.query.indicator, $scope.query.groupBy, $scope.query.filters);
				$scope.baseline = $scope.rows[0].baseline;
				$scope.target = $scope.rows[0].target;
				$scope.unit = $scope.rows[0].unit;
			}

		}, true);
	});
});

export default module;
