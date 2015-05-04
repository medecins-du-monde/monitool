"use strict";

angular.module('monitool.controllers.indicator', [])

	.controller('IndicatorListController', function($scope, hierarchy) {
		$scope.hierarchy = hierarchy;
		$scope.searchField = '';
	})
	
	.controller('IndicatorEditController', function($state, $scope, $stateParams, indicator, types, themes) {
		$scope.translations = {fr: FRENCH_TRANSLATION, es: SPANISH_TRANSLATION, en: ENGLISH_TRANSLATION};
		$scope.indicator = indicator;
		$scope.master = angular.copy(indicator);
		$scope.types = types;
		$scope.themes = themes;

		// Formula handlers
		$scope.addFormula = function() {
			$scope.indicator.formulas[makeUUID()] = {expression: '', parameters: {}};
		};

		$scope.deleteFormula = function(formulaId) {
			delete $scope.indicator.formulas[formulaId];
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
	})
	
	.controller('IndicatorReportingController', function($scope, Input, mtReporting, indicator, projects, indicatorsById) {
		$scope.indicator = indicator;
		// $scope.projects  = projects;
		$scope.plots = {};

		$scope.presentation = {display: 'value', plot: false, colorize: false};
		$scope.query = {
			type: "indicator",
			indicator: indicator,
			projects: projects,
			begin: mtReporting.getDefaultStartDate(),
			end: mtReporting.getDefaultEndDate(),
			groupBy: 'month',
		};

		// h@ck
		$scope.dates = {begin: new Date($scope.query.begin), end: new Date($scope.query.end)};
		$scope.$watch("dates", function() {
			$scope.query.begin = moment($scope.dates.begin).format('YYYY-MM-DD');
			$scope.query.end = moment($scope.dates.end).format('YYYY-MM-DD');
		}, true);

		// h@ck2 (for translation)
		$scope.$on('languageChange', function(e) {
			$scope.dates = angular.copy($scope.dates);
		})

		var inputsPromise = null;
		$scope.$watch('query', function(newQuery, oldQuery) {
			// if anything besides groupBy changes, we need to refetch.
			// FIXME: we could widely optimize this.
			if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end)
				inputsPromise = Input.fetchFromQuery(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				$scope.stats = mtReporting.computeIndicatorReporting(inputs, newQuery, indicatorsById);
			});
		}, true)
	})
	