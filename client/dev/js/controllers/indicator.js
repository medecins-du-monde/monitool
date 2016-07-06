"use strict";

angular

	.module(
		'monitool.controllers.indicator',
		[
			'monitool.services.utils.translate',
		]
	)

	.controller('IndicatorListController', function($scope, $state, hierarchy, uuid) {
		$scope.hierarchy = hierarchy;
		$scope.searchField = '';

		$scope.createIndicator = function() {
			$state.go('main.indicator.edit', {indicatorId: uuid.v4()});
		};
	})
	
	.controller('IndicatorEditController', function($state, $scope, $stateParams, $filter, googleTranslation, indicator, types, themes, uuid) {
		$scope.translations = {fr: FRENCH_TRANSLATION, es: SPANISH_TRANSLATION, en: ENGLISH_TRANSLATION};
		$scope.numLanguages = Object.keys($scope.translations).length;
		$scope.indicator = indicator;
		$scope.master = angular.copy(indicator);
		$scope.types = types;
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
	
	.controller('IndicatorReportingController', function($scope, Olap, mtReporting, indicator, projects, inputs) {
		$scope.indicator = indicator;
		$scope.plots = {};

		// Create default filter so that all inputs are used.
		$scope.filters = {_start: new Date('9999-01-01'), _end: new Date('0000-01-01')};
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.filters._start)
				$scope.filters._start = inputs[i].period;
			if (inputs[i].period > $scope.filters._end)
				$scope.filters._end = inputs[i].period;
		}

		// default group by
		if (mtReporting.getColumns('month', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		var cubes = {};
		projects.forEach(function(project) {
			var projectInputs = inputs.filter(function(i) { return i.project == project._id; });
			cubes[project._id] = Olap.Cube.fromProject(project, projectInputs);
		});

		// when input list change, or regrouping is needed, compute table rows again.
		$scope.$watch('[filters, groupBy]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end);

			$scope.rows = projects.map(function(project) {
				// Compute row.
				var cube     = cubes[project._id],
					planning = project.getIndicatorPlanningById(indicator._id),
					row      = mtReporting._makeIndicatorRow(cube, 0, $scope.groupBy, $scope.filters, $scope.cols, planning);

				// Add extra field, with project name.
				row.project = project.name;

				return row;
			});
		}, true);
	});

