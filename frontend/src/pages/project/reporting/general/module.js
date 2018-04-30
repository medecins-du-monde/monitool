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
import TimeSlot from 'timeslot-dag';

import uiRouter from '@uirouter/angularjs';

import mtComponentMiscPlusMinusIcon from '../../../../components/misc/plus-minus-icon';
import mtComponentExportCsv from '../../../../components/reporting/export-csv';
import mtComponentExportSvg from '../../../../components/reporting/export-svg';
import mtComponentField from '../../../../components/reporting/field';
import mtComponentGraph from '../../../../components/reporting/graph';


const module = angular.module(
	'monitool.pages.project.reporting.general',
	[
		uiRouter, // for $stateProvider

		mtComponentMiscPlusMinusIcon.name,
		mtComponentExportCsv.name,
		mtComponentExportSvg.name,
		mtComponentField.name,
		mtComponentGraph.name
	]
);


module.config(function($stateProvider) {

	$stateProvider.state('main.project.reporting.general', {
		url: '/general',
		template: require('./reporting.html'),
		controller: 'ProjectReportingController',
	});
});

module.controller('ProjectReportingController', function($scope, $filter, mtReporting, indicators) {

	// Create default filter so that all inputs are used.
	var now = new Date().toISOString().substring(0, 10);
	$scope.filters = {
		_location: "none",
		_start: $scope.masterProject.start,
		_end: now < $scope.masterProject.end ? now : $scope.masterProject.end
	};

	// default + available group by
	$scope.periodicities = ['day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'].filter(function(periodicity) {
		for (var i = 0; i < $scope.masterProject.forms.length; ++i) {
			var form = $scope.masterProject.forms[i];

			if (form.periodicity == 'free' || form.periodicity == periodicity)
				return true;

			try {
				let t = TimeSlot.fromDate(new Date(), form.periodicity);
				t.toUpperSlot(periodicity);
				return true;
			}
			catch (e) {
			}
		}
	});

	$scope.groupBy = $scope.periodicities[$scope.periodicities.length - 1];
	for (var i = 0; i < $scope.periodicities.length; ++i) {
		var periodicity = $scope.periodicities[i];
		if (mtReporting.getColumns(periodicity, $scope.filters._start, $scope.filters._end).length < 15) {
			$scope.groupBy = periodicity;
			break;
		}
	}

	$scope.splits = {};
	$scope.onSplitClick = function(rowId, partitionId) {
		if ($scope.splits[rowId] !== partitionId)
			$scope.splits[rowId] = partitionId;
		else
			delete $scope.splits[rowId];
	};

	// This hash allows to select indicators for plotting. It is used by directives.
	$scope.plots = {};

	$scope.$watch('cubes', function(cubes) {
		if (!cubes)
			return;

		// Create blocks
		$scope.blocks = $scope.masterProject.logicalFrames.map(function(logicalFrame, index) {
			return {text: $filter('translate')('project.logical_frame') + ": " + logicalFrame.name};
		})
		.concat([{text: $filter('translate')('indicator.cross_cutting')}])
		.concat([{text: $filter('translate')('indicator.extra')}])
		.concat($scope.masterProject.forms.map(function(form, index) {
			return {text: $filter('translate')('project.collection_form') + ": " + form.name};
		}));
		$scope.open = $scope.blocks.map(function(_, index) { return false; });

		// Watch form controls to update the view.
		$scope.$watch('[filters, groupBy, splits, open]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end, $scope.filters._location, $scope.masterProject)

			$scope.masterProject.logicalFrames.forEach(function(logicalFrame, index) {
				$scope.blocks[index].rows = $scope.open[index] ? mtReporting.computeLogicalFrameReporting(cubes, $scope.masterProject, logicalFrame, $scope.groupBy, $scope.filters) : null;
			});

			var index = $scope.masterProject.logicalFrames.length;
			$scope.blocks[index].rows = $scope.open[index] ? mtReporting.computeCrossCuttingReporting(cubes, $scope.masterProject, indicators, $scope.groupBy, $scope.filters) : null;
			$scope.blocks[index + 1].rows = $scope.open[index + 1] ? mtReporting.computeExtraReporting(cubes, $scope.masterProject, $scope.groupBy, $scope.filters) : null;

			$scope.masterProject.forms.forEach(function(form, index) {
				index += $scope.masterProject.logicalFrames.length + 2;
				$scope.blocks[index].rows = $scope.open[index] ? mtReporting.computeDataSourceReporting(cubes, $scope.masterProject, form, $scope.groupBy, $scope.filters, $scope.splits) : null;
			});

			// Work around graph bug
			$scope.rows = [];
			$scope.blocks.forEach(function(block) { if (block.rows) $scope.rows = $scope.rows.concat(block.rows); });
			mtReporting.deduplicateRows($scope.rows);
		}, true);
	});
});

export default module;

