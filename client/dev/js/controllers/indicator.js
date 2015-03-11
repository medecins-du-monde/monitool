"use strict";

angular.module('monitool.controllers.indicator', [])

	.controller('IndicatorListController', function($scope, mtRemoveDiacritics, hierarchy) {
		$scope.orderField = 'name';
		$scope.searchField = '';

		// FIXME move this to a directive/service....
		$scope.$watch('searchField', function(newValue, oldValue) {
			if (newValue.length < 3) {
				$scope.filter = false;
				$scope.hierarchy = hierarchy;
			}
			else {
				var filter = mtRemoveDiacritics(newValue).toLowerCase();
				$scope.filter = true;
				$scope.hierarchy = angular.copy(hierarchy).filter(function(theme) {
					theme.children = theme.children.filter(function(type) {
						type.children = type.children.filter(function(indicator) {
							var name = mtRemoveDiacritics(indicator.name).toLowerCase();
							return name.indexOf(filter) !== -1;
						});
						return type.children.length;
					});
					return theme.children.length;
				});
			}
		});
	})
	
	.controller('IndicatorChooseController', function($scope, $modalInstance, mtRemoveDiacritics, forbiddenIds, hierarchy) {
		$scope.forbidden = forbiddenIds;
		$scope.searchField = '';

		// FIXME move this to a directive/service....
		$scope.$watch('searchField', function(newValue, oldValue) {
			if (newValue.length < 3) {
				$scope.filter = false;
				$scope.hierarchy = hierarchy;
			}
			else {
				var filter = mtRemoveDiacritics(newValue).toLowerCase();
				$scope.filter = true;
				$scope.hierarchy = angular.copy(hierarchy).filter(function(theme) {
					theme.children = theme.children.filter(function(type) {
						type.children = type.children.filter(function(indicator) {
							var name = mtRemoveDiacritics(indicator.name).toLowerCase();
							return name.indexOf(filter) !== -1;
						});
						return type.children.length;
					});
					return theme.children.length;
				});
			}
		});

		$scope.choose = function(indicatorId) {
			$modalInstance.close(indicatorId);
		};

		$scope.cancel = function() {
			$modalInstance.dismiss()
		};
	})

	.controller('IndicatorEditController', function($state, $scope, $stateParams, $modal, mtFormula, mtFetch, indicator, indicatorsById, types, themes) {
		// Formula handlers
		$scope.addFormula = function() {
			var uuid  = makeUUID(),
				value = {name: '', expression: '', parameters: {}};

			$scope.indicator.formulas[uuid] = value;
		};

		$scope.deleteFormula = function(formulaId) {
			delete $scope.indicator.formulas[formulaId];
		};

		$scope.chooseIndicator = function(formulaId, symbol) {
			var usedIndicators = $scope.indicator.formulas[formulaId].__symbols.map(function(s) {
				return $scope.indicator.formulas[formulaId].parameters[s];
			}).filter(function(e) { return !!e; });
			usedIndicators.push(indicator._id);

			var indicatorId = $modal.open({
				templateUrl: 'partials/indicators/selector-popup.html',
				controller: 'IndicatorChooseController',
				size: 'lg',
				resolve: {
					forbiddenIds: function() { return usedIndicators; },
					hierarchy: function() { return mtFetch.themes({mode: "tree"}); }
				}
			}).result;

			indicatorId.then(function(indicatorId) {
				mtFetch.indicator(indicatorId).then(function(indicator) {
					$scope.indicatorsById[indicatorId] = indicator;
					$scope.indicator.formulas[formulaId].parameters[symbol] = indicatorId;
				});
			});
		};

		$scope.formulasAreValid = true;
		$scope.$watch('indicator.formulas', function() {
			$scope.formulasAreValid = true;
			for (var formulaId in $scope.indicator.formulas) {
				mtFormula.annotate($scope.indicator.formulas[formulaId]);
				if (!$scope.indicator.formulas[formulaId].__isValid)
					$scope.formulasAreValid = false;
			}
		}, true);

		// Form actions
		$scope.save = function() {
			// remove unused parameters
			for (var formulaId in $scope.indicator.formulas)
				mtFormula.clean($scope.indicator.formulas[formulaId]);

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

		// init scope
		$scope.indicatorsById = indicatorsById;
		$scope.indicator = indicator;
		$scope.master = angular.copy(indicator);
		$scope.types = types;
		$scope.themes = themes;
	})
	
	.controller('IndicatorReportingController', function($scope, mtReporting, indicator, projects, indicatorsById) {
		$scope.indicator = indicator;
		// $scope.projects  = projects;
		$scope.plots = {};

		$scope.presentation = {display: 'value', plot: false, colorize: false};
		$scope.query = {
			type: "indicator",
			indicator: indicator,
			projects: projects.map(function(p) { return mtReporting.getAnnotatedProjectCopy(p, indicatorsById); }),
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

		$scope.$on('languageChange', function(e) {
			$scope.dates = angular.copy($scope.dates);
		})

		var inputsPromise = null;
		$scope.$watch('query', function(newQuery, oldQuery) {
			// if anything besides groupBy changes, we need to refetch.
			// FIXME: we could widely optimize this.
			if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end)
				inputsPromise = mtReporting.getInputs(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				$scope.stats = mtReporting.regroupIndicator(inputs, newQuery, indicatorsById);
			});
		}, true)
	})
	