"use strict";

angular
	.module(
		'monitool.controllers.indicator',
		[
			'monitool.services.utils.translate',
		]
	)

	.controller('IndicatorListController', function($scope, indicators, themes) {
		$scope.indicators = indicators;
		$scope.themes = themes;

		// give a color to each theme
		// give to indicators the color of the first theme
		var classes = ["text-primary", "text-success", "text-info", "text-warning", "text-danger"];
		$scope.themes.forEach(function(theme, index) { theme.class = classes[index % classes.length]; });

		// allow to sort indicators by name, and still work on language change
		$scope.getName = function(a) { return a.name[$scope.language] };
	})
		
	.controller('IndicatorReportingController', function($scope, Cube, mtReporting, indicator, projects, cubes, themes) {
		$scope.themes = themes;
		$scope.indicator = indicator;
		$scope.open = {};
		$scope.plots = {};
		$scope.filters = {_location: "none", _start: new Date('9999-01-01T00:00:00Z'), _end: new Date('0000-01-01T00:00:00Z')};
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

