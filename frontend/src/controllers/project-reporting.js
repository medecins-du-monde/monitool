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
		'monitool.controllers.project.reporting',
		[
			'monitool.services.statistics.parser',
			"monitool.services.statistics.olap"
		]
	)

	.controller('ProjectSharedReportingController', function($scope, Cube) {
		Cube.fetchProject($scope.masterProject._id).then(function(cs) {
			// Index cubes by id.
			var cubes = {};
			cs.forEach(function(c) { cubes[c.id] = c; });

			$scope.cubes = cubes;
		});
	})

	.controller('ProjectReportingController', function($scope, $filter, TimeSlot, mtReporting, indicators) {

		// Create default filter so that all inputs are used.
		$scope.filters = {_location: "none", _start: $scope.masterProject.start, _end: $scope.masterProject.end < new Date() ? $scope.masterProject.end : new Date()};

		// default + available group by
		$scope.periodicities = ['day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'].filter(function(periodicity) {
			for (var i = 0; i < $scope.masterProject.forms.length; ++i) {
				var form = $scope.masterProject.forms[i];
				if (form.periodicity == 'free' || form.periodicity == periodicity || TimeSlot._upperSlots[form.periodicity].indexOf(periodicity) !== -1)
					return true;
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
	})

	.controller('ProjectDetailedReportingController', function($scope, $filter, mtReporting, indicators) {
		$scope.plots = {};

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = $scope.masterProject.getAllIndicators(indicators);
		$scope.wrap = {chosenElement: $scope.elementOptions[0]};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('wrap.chosenElement', function(element) {

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var filters = {_start: $scope.masterProject.start, _end: new Date() < $scope.masterProject.end ? new Date() : $scope.masterProject.end};

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

				element.element.partitions.forEach(function(partition) {
					filters[partition.id] = partition.elements.map(function(pe) {
						return pe.id;
					});
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
		});

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
	})

	// FIXME this need a complete rewrite with proper object oriented stuff
	.controller('ProjectOlapController', function($scope, $filter, CompoundCube, mtReporting, indicators) {

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = $scope.masterProject.getAllIndicators(indicators);
		$scope.wrap = {chosenElement: $scope.elementOptions[0]};

		// init objects that we will need to render query controls in the ux.
		$scope.query = {element: null, colDimensions: null, rowDimensions: null, filters: null};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('cubes', function(cubes) {
			if (!cubes)
				return;

			$scope.$watch('wrap.chosenElement', function(element) {
				var filters = {_start: $scope.masterProject.start, _end: new Date() < $scope.masterProject.end ? new Date() : $scope.masterProject.end};

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
					if (['day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'].indexOf(dimension.id) === -1)
						filters[dimension.id] = dimension.items;
				});

				// Add entity dimension
				if (cube.dimensionsById.entity) {
					var entities = $scope.masterProject.entities.filter(function(e) { return cube.dimensionsById.entity.items.indexOf(e.id) !== -1; }),
						groups   = $scope.masterProject.groups.filter(function(g) { return cube.dimensionGroupsById.group && cube.dimensionGroupsById.group.items.indexOf(g.id) !== -1; });

					$scope.dimensions.push({id: "entity", name: 'project.dimensions.entity', elements: entities, groups: groups});
				}

				// Add partitions
				if (element.type === 'variable')
					$scope.dimensions = $scope.dimensions.concat(element.element.partitions);

				['day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'semester', 'year'].forEach(function(time) {
					var dim = cube.dimensionsById[time] || cube.dimensionGroupsById[time];
					if (dim)
						$scope.dimensions.push({
							id: time,
							name: 'project.dimensions.' + time,
							elements: dim.items.map(function(i) { return {id: i, name: $filter('formatSlot')(i), title: $filter('formatSlotRange')(i) }; })
						});
				});
			});

			////////////////////////////////////////////////////
			// Each time the element is changed or a new dimension is chosen to split on, recreate allowed splits.
			////////////////////////////////////////////////////

			$scope.$watch('[dimensions, query.colDimensions, query.rowDimensions]', function() {
				// update available rows and cols
				var timeFields = ['year', 'semester', 'quarter', 'month', 'week_sat', 'week_sun', 'week_mon', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'day'],
					timeUsedOnCols = timeFields.find(function(tf) { return $scope.query.colDimensions.indexOf(tf) !== -1; }),
					timeUsedOnRows = timeFields.find(function(tf) { return $scope.query.rowDimensions.indexOf(tf) !== -1; });

				$scope.availableCols = $scope.dimensions.filter(function(dimension) {
					if (timeFields.indexOf(dimension.id) !== -1)
						return timeUsedOnCols == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
					else
						return $scope.query.rowDimensions.indexOf(dimension.id) == -1;
				});

				$scope.availableRows = $scope.dimensions.filter(function(dimension) {
					if (timeFields.indexOf(dimension.id) !== -1)
						return timeUsedOnRows == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
					else
						return $scope.query.colDimensions.indexOf(dimension.id) == -1;
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
					var dimension = $scope.dimensions.find(function(dim) { return dim.id == selectedDimId; });

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

				var cubeDimensions = $scope.query.colDimensions.concat($scope.query.rowDimensions),
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
