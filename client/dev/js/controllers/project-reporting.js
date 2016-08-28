"use strict";

angular
	.module(
		'monitool.controllers.project.reporting',
		[
			'monitool.services.statistics.parser',
			"monitool.services.statistics.olap"
		]
	)

	.controller('ProjectReportingController', function($scope, Olap, inputs, mtReporting) {
		// Create default filter so that all inputs are used.
		$scope.filters = {_location: "none", _start: $scope.project.start, _end: $scope.project.end < new Date() ? $scope.project.end : new Date()};

		// default group by
		if (mtReporting.getColumns('month', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		$scope.splits = {};
		$scope.onSplitClick = function(rowId, partitionId) {
			if ($scope.splits[rowId] !== partitionId)
				$scope.splits[rowId] = partitionId;
			else
				delete $scope.splits[rowId];
		};

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// when input list change, or regrouping is needed, compute table rows again.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.blocks = $scope.project.logicalFrames.map(function(logicalFrame, index) {
			return {text: "Logical frame: " + logicalFrame.name};
		}).concat($scope.project.forms.map(function(form, index) {
			return {text: "Data source: " + form.name};
		}));
		$scope.open = $scope.blocks.map(function(_, index) { return index == 0; });

		$scope.$watch('[filters, groupBy, splits, open]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end, $scope.filters._location, $scope.project)

			$scope.project.logicalFrames.forEach(function(logicalFrame, index) {
				if ($scope.open[index])
					$scope.blocks[index].rows = mtReporting.computeReporting(cubes, $scope.project, logicalFrame, $scope.groupBy, $scope.filters);
				else
					$scope.blocks[index].rows = null;
			});

			$scope.project.forms.forEach(function(form, index) {
				index += $scope.project.logicalFrames.length;
				if ($scope.open[index])
					$scope.blocks[index].rows = mtReporting.computeActivityReporting(cubes, $scope.project, form, $scope.groupBy, $scope.filters, $scope.splits);
				else
					$scope.blocks[index].rows = null;
			});

		}, true);
	})

	.controller('ProjectDetailedReportingController', function($scope, $filter, Olap, inputs, mtReporting) {
		$scope.plots = {};

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Compute cubes for all elements, from all inputs.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = $scope.project.getAllIndicators();
		$scope.wrap = {chosenElement: $scope.elementOptions[0]};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('wrap.chosenElement', function(element) {

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var filters = {_start: $scope.project.start, _end: new Date() < $scope.project.end ? new Date() : $scope.project.end};

			// default group by
			var groupBy;
			if (mtReporting.getColumns('month', filters._start, filters._end).length < 15)
				groupBy = 'month';
			else if (mtReporting.getColumns('quarter', filters._start, filters._end).length < 15)
				groupBy = 'quarter';
			else
				groupBy = 'year';

			// extra filters if variable is selected.
			if (element.type == 'variable') {
				var cube = cubes[element.element.id];

				cube.dimensions.forEach(function(dimension) {
					if (dimension.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
						filters[dimension.id] = dimension.items.slice();
				});

				// make default query.
				$scope.query = { type: 'variable', element: element.element, filters: filters, groupBy: groupBy };

				// filters
				$scope.dimensions = element.element.partitions;
			}
			else {
				$scope.query = { type: 'indicator', indicator: element.indicator, filters: filters, groupBy: groupBy};
				$scope.dimensions = [];
			}
		});

		////////////////////////////////////////////////////
		// The query object contains everything that is needed to compute the final table.
		// When it changes, we need to update the results.
		////////////////////////////////////////////////////
		
		$scope.$watch('query', function(query) {
			$scope.cols = mtReporting.getColumns($scope.query.groupBy, $scope.query.filters._start, $scope.query.filters._end);

			if (query.type == 'variable')
				$scope.rows = mtReporting.computeDetailedActivityReporting(cubes, $scope.project, $scope.query.element, $scope.query.groupBy, $scope.query.filters);
			else
				$scope.rows = mtReporting.computeDetailedReporting(cubes, $scope.project, $scope.query.indicator, $scope.query.groupBy, $scope.query.filters);

		}, true);
	})

	.controller('ProjectOlapController', function($scope, $filter, Olap, mtReporting, inputs) {

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Compute cubes for all elements, from all inputs.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = $scope.project.getAllIndicators();
		$scope.wrap = {chosenElementId: $scope.elementOptions[0].id};

		// init objects that we will need to render query controls in the ux.
		$scope.query = {elementId: null, colDimensions: null, rowDimensions: null, filters: null};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('wrap.chosenElementId', function(element) {

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var filters = {_start: $scope.project.start, _end: new Date() < $scope.project.end ? new Date() : $scope.project.end};
			
			if (element.type === 'variable') {
				var cube = cubes[element.id];
				
				// Init all filters as full
				cube.dimensions.forEach(function(dimension) {
					if (dimension.id !== 'day')
						filters[dimension.id] = dimension.items;
				});

				// make default query.
				$scope.query = {elementId: elementId, colDimensions: [], rowDimensions: ['month'], filters: filters};

				////////////////////////////////////////
				// Create needed info to display controls on screen
				////////////////////////////////////////
				$scope.dimensions = [];

				// Add entity dimension
				if (cube.dimensionsById.entity)
					$scope.dimensions.push(
						{id: "entity", name: 'project.dimensions.entity', elements: $scope.project.entities, groups: $scope.project.groups}
					);

				// Add partitions
				$scope.dimensions = $scope.dimensions.concat(element.partitions);
			}
			else {
				// Add partitions
				$scope.dimensions = [];
			}

			// Add time dimensions
			$scope.dimensions.push(
				{id: "day",     name: 'project.dimensions.day',     elements: cube._getDimension('day').items.map(function(i) { return {id: i, name: i}; }),          groups: []},
				{id: "week",    name: 'project.dimensions.week',    elements: cube._getDimensionGroup('week').items.map(function(i) { return {id: i, name: i}; }),    groups: []},
				{id: "month",   name: 'project.dimensions.month',   elements: cube._getDimensionGroup('month').items.map(function(i) { return {id: i, name: i}; }),   groups: []},
				{id: "quarter", name: 'project.dimensions.quarter', elements: cube._getDimensionGroup('quarter').items.map(function(i) { return {id: i, name: i}; }), groups: []},
				{id: "year",    name: 'project.dimensions.year',    elements: cube._getDimensionGroup('year').items.map(function(i) { return {id: i, name: i}; }),    groups: []}
			);
		});

		////////////////////////////////////////////////////
		// Each time the element is changed or a new dimension is chosen to split on, recreate allowed splits.
		////////////////////////////////////////////////////

		$scope.$watch('[dimensions, query.colDimensions, query.rowDimensions]', function() {
			// update available rows and cols
			var timeFields = ['year', 'quarter', 'month', 'week', 'day'],
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

			////////////////////////////////////////
			// Query cube & postprocess for display
			////////////////////////////////////////

			var cube = cubes[query.elementId],
				cubeDimensions = $scope.query.colDimensions.concat($scope.query.rowDimensions),
				cubeFilters = mtReporting.createCubeFilter(cube, $scope.query.filters);

			var makeRowCol = function(selectedDimId) {
				var dimension = $scope.dimensions.find(function(dim) { return dim.id == selectedDimId; });

				var rowcolInfo = [];
				Array.prototype.push.apply(rowcolInfo, dimension.groups);
				Array.prototype.push.apply(rowcolInfo, dimension.elements);
				rowcolInfo.push({id: '_total', name: "Total", members: true}); // members:true, so that group icon is displayed
				return rowcolInfo;
			};

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
