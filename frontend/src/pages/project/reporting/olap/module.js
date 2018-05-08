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
import uiSelect from 'ui-select';

import 'ui-select/dist/select.min.css';

import {product} from '../../../../helpers/array';
import mtComponentIndicatorSelect from '../../../../components/reporting/indicator-select';

const module = angular.module(
	'monitool.pages.project.reporting.olap',
	[
		uiRouter, // for $stateProvider
		uiSelect,

		mtComponentIndicatorSelect.name
	]
);


module.config(function($stateProvider) {
	$stateProvider.state('main.project.reporting.olap', {
		url: '/olap',
		template: require('./olap.html'),
		controller: 'ProjectOlapController'
	});

});


// FIXME this need a complete rewrite with proper object oriented stuff
module.controller('ProjectOlapController', function($scope, $filter, CompoundCube, mtReporting, indicators) {

	const timeGroupBy = [
		'year', 'semester', 'quarter', 'month', 'week_sat', 'week_sun', 'week_mon', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'day'
	]

	$scope.indicators = indicators;

	////////////////////////////////////////////////////
	// Initialization code.
	////////////////////////////////////////////////////

	// Create array with ngOptions for the list of variables, and init select value.
	// $scope.elementOptions = $scope.masterProject.getAllIndicators(indicators);
	$scope.wrap = {chosenElement: null};

	// init objects that we will need to render query controls in the ux.
	$scope.query = {element: null, colDimensions: null, rowDimensions: null, filters: null};

	////////////////////////////////////////////////////
	// Each time the element is changed, initialize the query object.
	////////////////////////////////////////////////////

	$scope.onChosenElementUpdate = function(element) {
		$scope.wrap.chosenElement = element;
	};

	$scope.$watch('cubes', function(cubes) {
		if (!cubes)
			return;

		$scope.$watch('wrap.chosenElement', function(element) {
			var now = new Date().toISOString().substring(0, 10);
			var filters = {
				_start: $scope.masterProject.start,
				_end: now < $scope.masterProject.end ? now : $scope.masterProject.end
			};

			// Work around invalid indicators (those w/o computation)
			if (element.type === 'indicator' && !element.indicator.computation) {
				$scope.query = {element: element, colDimensions: [], rowDimensions: [], filters: filters};
				$scope.dimensions = [];
				return;
			}

			// Hack: Same as previous controller: change the default dates when chosing an indicator from a logicalframework
			// This depends on another hack inserted in services/models/project.js:getAllIndicators()
			if (typeof element.logicalFrameIndex === 'number') {
				var lfStart = $scope.masterProject.logicalFrames[element.logicalFrameIndex].start;
				var lfEnd = $scope.masterProject.logicalFrames[element.logicalFrameIndex].end;
				if (lfStart && filters._start < lfStart)
					filters._start = lfStart;
				if (lfEnd && lfEnd < filters._end)
					filters._end = lfEnd;
			}

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var cube;
			if (element.type === 'variable')
				cube = cubes[element.element.id];
			else
				cube = new CompoundCube(element.indicator.computation, cubes);

			// make default query.
			$scope.query = {element: element, colDimensions: [], rowDimensions: [cube.dimensions[0].id], filters: filters};
			$scope.dimensions = [];

			// Init all filters as full
			cube.dimensions.forEach(function(dimension) {
				if (!timeGroupBy.includes(dimension.id))
					filters[dimension.id] = dimension.items;
			});

			// Add entity dimension
			if (cube.dimensionsById.entity) {
				var entities = $scope.masterProject.entities.filter(e => cube.dimensionsById.entity.items.includes(e.id)),
					groups   = $scope.masterProject.groups.filter(g => cube.dimensionGroupsById.group && cube.dimensionGroupsById.group.items.includes(g.id));

				$scope.dimensions.push({id: "entity", name: 'project.dimensions.entity', elements: entities, groups: groups});
			}

			// Add partitions
			if (element.type === 'variable')
				$scope.dimensions.push(...element.element.partitions);

			timeGroupBy.forEach(function(time) {
				var dim = cube.dimensionsById[time] || cube.dimensionGroupsById[time];
				if (dim)
					$scope.dimensions.push({
						id: time,
						name: 'project.dimensions.' + time,
						elements: dim.items.map(i => {
							return {id: i, name: $filter('formatSlot')(i), title: $filter('formatSlotRange')(i) };
						})
					});
			});
		});

		////////////////////////////////////////////////////
		// Each time the element is changed or a new dimension is chosen to split on, recreate allowed splits.
		////////////////////////////////////////////////////

		$scope.$watch('[dimensions, query.colDimensions, query.rowDimensions]', function() {
			// update available rows and cols
			var timeUsedOnCols = timeGroupBy.find(tf => $scope.query.colDimensions.includes(tf)),
				timeUsedOnRows = timeGroupBy.find(tf => $scope.query.rowDimensions.includes(tf));

			$scope.availableCols = $scope.dimensions.filter(dimension => {
				if (timeGroupBy.includes(dimension.id))
					return timeUsedOnCols == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return !$scope.query.rowDimensions.includes(dimension.id);
			});

			$scope.availableRows = $scope.dimensions.filter(dimension => {
				if (timeGroupBy.includes(dimension.id))
					return timeUsedOnRows == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return !$scope.query.colDimensions.includes(dimension.id);
			});
		}, true);

		////////////////////////////////////////////////////
		// The query object contains everything that is needed to compute the final table.
		// When it changes, we need to update the results.
		////////////////////////////////////////////////////

		$scope.$watch('query', function(query) {

			if (query.element.type === 'indicator' && !query.element.indicator.computation) {
				$scope.display = {
					data: 'formula_missing',
					cols: [],
					rows: []
				};
				return;
			}

			var makeRowCol = function(selectedDimId) {
				var dimension = $scope.dimensions.find(dim => dim.id == selectedDimId);

				var rowcolInfo = [];
				Array.prototype.push.apply(rowcolInfo, dimension.groups);
				Array.prototype.push.apply(rowcolInfo, dimension.elements);
				rowcolInfo.push({id: '_total', name: "Total", members: true}); // members:true, so that group icon is displayed
				return rowcolInfo;
			};

			////////////////////////////////////////
			// Query cube & postprocess for display
			////////////////////////////////////////
			var cube;
			if (query.element.type == 'variable') {
				cube = cubes[query.element.element.id];

				// Dirty patch for colorization
				$scope.colorization = null;
				$scope.unit = null;

				// Dirty patch to display baseline and target
				$scope.baseline = $scope.target = null;
			}
			else {
				var planning = query.element.indicator;

				cube = new CompoundCube(planning.computation, cubes);

				// Dirty patch for colorization
				if (planning.colorize && planning.baseline !== null && planning.target !== null)
					$scope.colorization = {baseline: planning.baseline, target: planning.target};
				else
					$scope.colorization = null;

				if (planning.computation) {
					if (/1000/.test(planning.computation.formula))
						$scope.unit = '‰';
					else if (/100/.test(planning.computation.formula))
						$scope.unit = '%';
					else
						$scope.unit = undefined;
				}
				else
					$scope.unit = undefined;

				// Dirty patch to display baseline and target
				$scope.baseline = planning.baseline;
				$scope.target = planning.target;
			}

			var cubeDimensions = [...$scope.query.colDimensions, ...$scope.query.rowDimensions],
				cubeFilters = mtReporting.createCubeFilter(cube, $scope.query.filters);

			$scope.display = {
				data: cube.flatQuery(cubeDimensions, cubeFilters),
				cols: query.colDimensions.map(makeRowCol),
				rows: query.rowDimensions.map(makeRowCol)
			};

			// work around grid bug...
			if ($scope.display.rows.length === 0) {
				$scope.display.rows = $scope.display.cols;
				$scope.display.cols = [];
			}

		}, true);
	});
});



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
			}, true);
		}
	}
});


export default module;

