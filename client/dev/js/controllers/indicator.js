"use strict";

angular
	.module(
		'monitool.controllers.indicator',
		[
			'monitool.services.utils.translate',
		]
	)

	.controller('IndicatorListController', function($scope, $state, indicators, themes, uuid) {
		$scope.indicators = indicators;
		$scope.themes = themes;

		$scope.getName = function(a) { return a.name[$scope.language] };

		var classes = ["label-primary", "label-success", "label-info", "label-warning", "label-danger"];
		$scope.themes.forEach(function(theme, index) {
			theme.class = classes[index % classes.length];
		});

		$scope.createIndicator = function() {
			$state.go('main.indicator.edit', {indicatorId: uuid.v4()});
		};
	})
	
	.controller('IndicatorEditController', function($state, $scope, $stateParams, $filter, googleTranslation, indicator, themes, uuid) {
		$scope.translations = {fr: FRENCH_TRANSLATION, es: SPANISH_TRANSLATION, en: ENGLISH_TRANSLATION};
		$scope.numLanguages = Object.keys($scope.translations).length;
		$scope.indicator = indicator;
		$scope.master = angular.copy(indicator);
		$scope.themes = themes;

		$scope.indicatorSaveRunning = false;

		var indicatorWatch = $scope.$watch('indicator', function() {
			$scope.indicatorChanged = !angular.equals($scope.master, $scope.indicator);
			$scope.indicatorSavable = $scope.indicatorChanged && !$scope.indicatorForm.$invalid;
		}, true);

		var pageChangeWatch = $scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
			if ($scope.indicatorSaveRunning) {
				e.preventDefault();	
				return;
			}

			if ($scope.indicatorChanged) {
				// then ask the user if he meant it
				if (!window.confirm($filter('translate')('shared.sure_to_leave')))
					e.preventDefault();
			}
		});

		// Form actions
		$scope.save = function() {
			if (!$scope.indicatorSavable || $scope.indicatorSaveRunning)
				return;

			$scope.indicatorSaveRunning = true;

			return $scope.indicator.$save().then(function() {
				$scope.master = angular.copy($scope.indicator);
				$scope.indicatorChanged = false;
				$scope.indicatorSavable = false;
				$scope.indicatorSaveRunning = false;
			}).catch(function(error) {
				// Display message to tell user that it's not possible to save.
				var translate = $filter('translate');
				alert(translate('project.saving_failed'));

				// reload page.
				window.location.reload();
			});
		};

		$scope.translate = function(key, destLanguage, sourceLanguage) {
			googleTranslation
				.translate(indicator[key][sourceLanguage], destLanguage, sourceLanguage)
				.then(function(result) {
					indicator[key][destLanguage] = result;
				});
		};

		$scope.reset = function() {
			// When button is disabled, do not execute action.
			if (!$scope.indicatorChanged || $scope.indicatorSaveRunning)
				return;

			$scope.indicator = angular.copy($scope.master);
		};

		$scope.delete = function() {
			var question = $filter('translate')('indicator.delete_indicator');

			if (window.confirm(question)) {
				pageChangeWatch();
				indicatorWatch();

				$scope.indicatorSaveRunning = true;
				indicator.$delete(function() {
					$scope.indicatorSaveRunning = false;
					$state.go('main.indicators');
				});
			}
		};

	})
	
	.controller('IndicatorReportingController', function($scope, Cube, mtReporting, indicator, projects, cubes) {
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

