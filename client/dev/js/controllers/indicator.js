"use strict";

angular

	.module(
		'monitool.controllers.indicator',
		[
			'monitool.services.translate',
		]
	)

	.controller('IndicatorListController', function($scope, hierarchy) {
		$scope.hierarchy = hierarchy;
		$scope.searchField = '';
	})
	
	.controller('IndicatorEditController', function($state, $scope, $stateParams, $filter, googleTranslation, indicator, types, themes) {
		$scope.translations = {fr: FRENCH_TRANSLATION, es: SPANISH_TRANSLATION, en: ENGLISH_TRANSLATION};
		$scope.numLanguages = 3;
		$scope.indicator = indicator;
		$scope.master = angular.copy(indicator);
		$scope.types = types;
		$scope.themes = themes;
		$scope.isNew = $stateParams.indicatorId === 'new';

		$scope.translate = function(key, destLanguage, sourceLanguage) {
			googleTranslation
				.translate(indicator[key][sourceLanguage], destLanguage, sourceLanguage)
				.then(function(result) {
					indicator[key][destLanguage] = result;
				});
		};

		// Form actions
		$scope.save = function() {
			// create random id if new indicator
			if ($stateParams.indicatorId === 'new')
				$scope.indicator._id = makeUUID();

			// persist
			$scope.indicator.$save(function() {
				$scope.master = angular.copy($scope.indicator);
				$state.go('main.indicators');
			});
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.indicator);
		};

		$scope.reset = function() {
			$scope.indicator = angular.copy($scope.master);
		};

		$scope.delete = function() {
			var question = $filter('translate')('indicator.delete_indicator');

			if (window.confirm(question)) {
				pageChangeWatch();

				indicator.$delete(function() {
					$state.go('main.indicators');
				});
			}
		};

		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// if unsaved changes were made
			if (!angular.equals($scope.master, $scope.indicator)) {
				// then ask the user if he meant it
				if (!window.confirm($filter('translate')('shared.sure_to_leave')))
					event.preventDefault();
			}
		});
	})
	
	.controller('IndicatorReportingController', function($scope, mtReporting, indicator, projects, inputs) {
		$scope.indicator = indicator;
		$scope.plots = {};

		// Create default filter so that all inputs are used.
		$scope.filters = {};
		$scope.filters.begin = new Date('9999-01-01T00:00:00Z')
		$scope.filters.end = new Date('0000-01-01T00:00:00Z');
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.filters.begin)
				$scope.filters.begin = inputs[i].period;
			if (inputs[i].period > $scope.filters.end)
				$scope.filters.end = inputs[i].period;
		}

		// default group by
		if (mtReporting.getColumns('month', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		// When filter changes (or init), build the list of inputs to pass to the scope.
		$scope.$watch('filters', function() {
			$scope.inputs = inputs.filter(function(input) {
				return input.period >= $scope.filters.begin && input.period <= $scope.filters.end;
			});
		}, true);

		// when input list change, or regrouping is needed, compute table rows again.
		$scope.$watchGroup(['inputs', 'groupBy'], function() {
			var reporting = mtReporting.computeIndicatorReporting($scope.inputs, projects, indicator, $scope.groupBy);
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end);
			$scope.rows = [];

			projects.forEach(function(project) {
				$scope.rows.push({
					id: project._id,
					type: 'data',
					indent: 0,
					name: project.name,
					unit: indicator.unit,
					colorize: project.indicators[indicator._id].colorize,
					baseline: project.indicators[indicator._id].baseline,
					target: project.indicators[indicator._id].target,
					cols: $scope.cols.map(function(col) {
						try { return reporting[project._id][col.id]; }
						catch (e) { return null; }
					})
				});
			});
		});
	});

