"use strict";

var monitoolControllers = angular.module('MonitoolControllers', ['MonitoolServices', 'ui.bootstrap', 'ui.select', 'ui.bootstrap.showErrors']);


var period = function(date) {
	var month = date.getMonth() + 1,
		year  = date.getFullYear();

	return year + '-' + (month < 10 ? '0' : '') + month;
};


monitoolControllers.controller('MenuController', function($scope, $location) {
	$scope.currentPage = $location.path().split('/')[1];

	$scope.changePage = function(page) {
		$location.url('/' + page);
		$scope.currentPage = page;
	};
});

monitoolControllers.controller('SubMenuController', function($scope, $routeParams, $location) {
	$scope.currentPage = $location.path().split('/')[3];
	$scope.projectId = $routeParams.projectId;

	$scope.changePage = function(page) {
		if ($routeParams.projectId !== 'new')
			$location.url('/projects/' + $routeParams.projectId + '/' + page);
	};
});

///////////////////////////
// Project
///////////////////////////

monitoolControllers.controller('ProjectListController', function($scope, $location, projects) {
	$scope.projects = projects;

	$scope.create = function() {
		$location.url('/projects/new');
	};
});

monitoolControllers.controller('ProjectDescriptionController', function($location, $scope, $routeParams, mtDatabase, project) {
	$scope.project = project;
	$scope.master = angular.copy(project);
	
	// on save
	$scope.update = function() {
		if ($routeParams.projectId === 'new')
			$scope.project._id = PouchDB.utils.uuid().toLowerCase();

		mtDatabase.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);

			if ($routeParams.projectId === 'new')
				$location.url('/projects/' + result.id + '/description');

		}).catch(function(error) {
			$scope.error = error;
		});
	};

	$scope.reset = function() {
		$scope.project = angular.copy($scope.master);
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.project);
	};
});

monitoolControllers.controller('ProjectCenterListController', function($scope, project, inputsByCenterId, mtDatabase) {
	$scope.project = project;
	$scope.usage = inputsByCenterId;

	$scope.delete = function(centerId) {
		delete $scope.project.center[centerId];
		mtDatabase.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
		});
	};

	$scope.create = function() {
		var newCenterName = $scope.newCenter ? $scope.newCenter.trim() : '';
		$scope.newCenter = '';

		if (newCenterName && newCenterName.length) {
			for (var key in $scope.project.center)
				if ($scope.project.center[key].name === newCenterName)
					return;

			$scope.project.center[PouchDB.utils.uuid().toLowerCase()] = {name: newCenterName};
			mtDatabase.put($scope.project).then(function(result) {
				$scope.project._rev = result.rev;
			});
		}
	};
});


monitoolControllers.controller('ProjectLogicalFrameController', function($scope, $location, project) {
	// pass data to view
	$scope.project = project;

	// $scope.create = function() {
	// 	$location.url('/projects/' + project._id + '/plannings/new');
	// };
});


monitoolControllers.controller('ProjectPlanningsController', function($scope, $location, project, mtDatabase) {
	$scope.project = project;

	$scope.create = function() {
		var newPlanningName = $scope.newPlanning ? $scope.newPlanning.trim() : '';
		$scope.newPlanning = '';

		if (newPlanningName && newPlanningName.length) {
			for (var key in $scope.project.plannings)
				if ($scope.project.plannings[key].name === newPlanningName)
					return;

			$scope.project.plannings[PouchDB.utils.uuid().toLowerCase()] = {
				name: newPlanningName,
				periodicity: "monthly",
				useProjectStart: true,
				useProjectEnd: true,
				indicators: {},
				compute: {}
			};

			mtDatabase.put($scope.project).then(function(result) {
				$scope.project._rev = result.rev;
			});
		}
	};
});

monitoolControllers.controller('ProjectPlanningListController', function($scope, $location, $routeParams, project, indicators, themes, types) {
	// pass models directly to view.
	$scope.project    = project;
	$scope.indicators = indicators;
	$scope.themes     = themes;
	$scope.types      = types;

	// load indicators in a hash to be able to display names on the table.
	$scope.indicatorsById = {};
	$scope.indicators.forEach(function(indicator) {
		$scope.indicatorsById[indicator._id] = indicator;
	});

	// a planning is always defined.
	$scope.planningId = $routeParams.planningId;
	$scope.planning   = project.plannings[$routeParams.planningId];

	console.log($scope.planning)

	$scope.updateDependencies = function() {
		var updateDependencyRec = function(indicatorId, oldDependencyTree, newDependencyTree) {
			var formulaId = oldDependencyTree[indicatorId];
			if (!formulaId) // stop recursing
				newDependencyTree[indicatorId] = null; // this one is entered by hand.
			else {
				var formula = $scope.indicatorsById[indicatorId].formulas[formulaId];
				newDependencyTree[indicatorId] = formulaId;
				for (var parameterName in formula.parameters)
					updateDependencyRec(formula.parameters[parameterName], oldDependencyTree, newDependencyTree);
			}
		};

		var newDependencyTree = {};
		for (var indicatorId in $scope.planning.indicators)
			updateDependencyRec(indicatorId, $scope.planning.compute, newDependencyTree);

		$scope.planning.compute = newDependencyTree;
	};

	$scope.sumAllowed = function(indicatorId) {
		// if it is allowed for the given indicator, then it's all ok.
		if ($scope.indicatorsById[indicatorId].sumAllowed)
			return true;

		// we need to check the formula.
		var formulaId = $scope.planning.compute[indicatorId];
		if (!formulaId)
			return false; // no formula => no.

		var formula = $scope.indicatorsById[indicatorId].formulas[formulaId];
		for (var parameterName in formula.parameters)
			if (!$scope.sumAllowed(formula.parameters[parameterName]))
				return false;

		return true;
	};

	$scope.create = function() {
		// $location.url('/projects/' + project._id + '/plannings/' + $routeParams.planningId + '/new');
	};
});

monitoolControllers.controller('ProjectPlanningEditController', function($scope, $location, $routeParams, mtDatabase, project, indicator) {
	$scope.project = project;
	$scope.planningId = $routeParams.planningId;
	$scope.planningG = project.plannings[$routeParams.planningId];
	$scope.indicator = indicator;

	console.log($scope.planning)
	// $scope.planning = project.plannings[$routeParams.planningId].indicators[$routeParams.indicatorId];

	// $scope.indicators = indicators;
	// $scope.types      = types;
	// $scope.themes     = themes;

	if ($routeParams.indicatorId == 'new') {
		// $scope.container = {indicator: null};
		$scope.planning  = {
			formula: null,
			source: '',
			relevance: '',
			periodicity: 'monthly',
			useProjectStart: true, start: project.begin,
			useProjectEnd: true, end: project.end,
			target: [],
			baseline: null,
			minimum: 0, orangeMinimum: 20, greenMinimum: 40, greenMaximum: 60, orangeMaximum: 80, maximum: 100
		};
	}
	else {
		// var tmp = indicators.filter(function(i) { return i._id == $routeParams.indicatorId });
		$scope.planning  = project.plannings[$routeParams.planningId].indicators[$routeParams.indicatorId];
		// $scope.container = {indicator: tmp[0]};
	}
	$scope.master = angular.copy($scope.planning);


	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.planning);
	};

	$scope.reset = function() {
		$scope.planning = angular.copy($scope.master);
	};

	$scope.addTarget = function() {
		$scope.planning.targets.push({value: null, month: null})
	};

	$scope.removeTarget = function(target) {
		$scope.planning.targets.splice($scope.planning.targets.indexOf(target), 1);
	};

	$scope.update = function() {
		if ($routeParams.indicatorId !== 'new')
			delete $scope.project.planning[$routeParams.indicatorId];

		$scope.project.planning[$scope.container.indicator._id] = $scope.planning;
		mtDatabase.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.planning);

			if ($routeParams.indicatorId === 'new')
				$location.url('/projects/' + result.id + '/plannings/' + $scope.container.indicator._id);
		});
	};
});

monitoolControllers.controller('ProjectUserListController', function($scope) {

});

monitoolControllers.controller('ProjectUserEditController', function($scope, project) {
	$scope.project = project;
});



///////////////////////////
// Indicators
///////////////////////////

monitoolControllers.controller('IndicatorListController', function($scope, $q, $location, hierarchy) {
	$scope.hierarchy = hierarchy.hierarchy;
	$scope.types     = hierarchy.types;
	$scope.themes    = hierarchy.themes;

	$scope.create = function() {
		$location.url('/indicators/new');
	};
});

monitoolControllers.controller('IndicatorEditController', function($scope, $routeParams, $location, mtDatabase, indicator, indicators, types, themes) {
	// Formula handlers
	$scope.addFormula = function() {
		var uuid  = PouchDB.utils.uuid().toLowerCase(),
			value = {name: '', expression: '', parameters: {}};

		$scope.indicator.formulas[uuid] = value;
	};

	$scope.deleteFormula = function(formulaId) {
		delete $scope.indicator.formulas[formulaId];
	};

	$scope.updateFormula = function(formulaId) {
		// Helper function to recursively retrieve symbols from abstract syntax tree.
		var getSymbolsRec = function(root, symbols) {
			if (root.type === 'OperatorNode' || root.type === 'FunctionNode')
				root.params.forEach(function(p) { getSymbolsRec(p, symbols); });
			else if (root.type === 'SymbolNode')
				symbols[root.name] = true;

			return Object.keys(symbols);
		};
		
		var formula = $scope.indicator.formulas[formulaId];
		formula.isValid = true;
		try {
			var expression = math.parse(formula.expression);
			// do not allow empty formula
			if (expression.type === 'ConstantNode' && expression.value === 'undefined')
				throw new Error();
			
			formula.symbols = getSymbolsRec(expression, {});
		}
		catch (e) { 
			formula.symbols = [];
			formula.isValid = false;
		}

		var numSymbols = formula.symbols.length;
		for (var i = 0; i < numSymbols; ++i)
			if (!formula.parameters[formula.symbols[i]])
				formula.isValid = false;

		if (!formula.name)
			formula.isValid = false;
	};

	$scope.formulaInvalid = function() {
		return Object.keys($scope.indicator.formulas).some(function(formulaId) {
			return !$scope.indicator.formulas[formulaId].isValid;
		});
	};

	// Form actions
	$scope.reset = function() {
		$scope.indicator = angular.copy($scope.master);
	};

	$scope.save = function() {
		if ($routeParams.indicatorId === 'new')
			$scope.indicator._id = PouchDB.utils.uuid().toLowerCase();

		mtDatabase.put($scope.indicator).then(function(result) {
			$scope.indicator._rev = result.rev;
			$scope.master = angular.copy($scope.indicator);

			if ($routeParams.indicatorId === 'new')
				$location.url('/indicators/' + result.id);
		});
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.indicator);
	};

	$scope.remove = function() {
		console.log($scope.indicator);
	};

	// init scope
	$scope.indicator  = indicator;
	for (var formulaId in indicator.formulas)
		$scope.updateFormula(formulaId);

	$scope.master     = angular.copy(indicator);
	$scope.indicators = indicators.rows.map(function(row) { return row.doc; }).filter(function(i) { return i._id != indicator._id });
	$scope.types      = types.rows.map(function(row) { return row.doc; });
	$scope.themes     = themes.rows.map(function(row) { return row.doc; });
});

/**
 * this controller and theme controller are the same, factorize it!
 */
monitoolControllers.controller('TypeListController', function($q, $scope, types, typeUsages, mtDatabase) {
	$scope.types = types;
	$scope.usage = typeUsages;

	$scope.add = function() {
		var newType = {_id: PouchDB.utils.uuid().toLowerCase(), type: 'type', name: $scope.newType || ''};
		newType.name = newType.name.trim();

		$scope.newType = '';
		if (newType.name.length && !$scope.types.filter(function(type) { return type.name == newType.name; }).length) {
			$scope.types.push(newType)
			mtDatabase.put(newType);
		}
	};

	$scope.remove = function(type) {
		$scope.types = $scope.types.filter(function(lType) { return lType !== type });
		mtDatabase.remove(type);
	};
});

monitoolControllers.controller('ThemeListController', function($q, $scope, themes, themeUsages, mtDatabase) {
	$scope.themes = themes;
	$scope.usage = themeUsages;

	$scope.add = function() {
		var newTheme = {_id: PouchDB.utils.uuid().toLowerCase(), type: 'theme', name: $scope.newTheme || ''};
		newTheme.name = newTheme.name.trim();

		$scope.newTheme = '';
		if (newTheme.name.length && !$scope.themes.filter(function(theme) { return theme.name == newTheme.name; }).length) {
			$scope.themes.push(newTheme)
			mtDatabase.put(newTheme);
		}
	};

	$scope.remove = function(theme) {
		$scope.themes = $scope.themes.filter(function(lTheme) { return lTheme !== theme });
		mtDatabase.remove(theme);
	};
});

///////////////////////////
// Input
///////////////////////////

monitoolControllers.controller('InputListController', function($scope, $q, mtDatabase) {
	$scope.inputMonth = period(new Date());
	$scope.maxMonth = $scope.inputMonth;

	$scope.reload = function() {
		$scope.ready = false;

		if (!$scope.inputMonth || !$scope.inputMonth.match(/[0-9]{4}\-[0-9]{2}/))
			return;

		// form control is buggy...
		if ($scope.inputMonth > $scope.maxMonth)
			$scope.inputMonth = $scope.maxMonth;

		$q.all([
			mtDatabase.query('monitool/by_type', {key: 'project'}),
			mtDatabase.query('monitool/input_by_month', {key: $scope.inputMonth, include_docs: true})
		]).then(function(result) {
			var projects = result[0].rows.map(function(row) { return row.value; }),
				inputs   = result[1].rows.map(function(row) { return row.doc; });

			$scope.inputs = [];
			$scope.allDone = true;

			projects.forEach(function(project) {
				for (var centerId in project.center) {
					var filledIndicators = 0,
						totalIndicators  = Object.keys(project.planning).length,
						center           = project.center[centerId],
						input            = inputs.filter(function(input) { return input.center === centerId; });

					if (input.length)
						for (var indicatorId in project.planning)
							if (typeof input[0].indicators[indicatorId] !== 'undefined')
								filledIndicators++;

					$scope.inputs.push({
						centerId: centerId,
						centerName: center.name,
						projectName: project.name,
						projectCountry: project.country,
						missingIndicators: totalIndicators - filledIndicators,
						totalIndicators: totalIndicators
					});

					if (totalIndicators !== filledIndicators)
						$scope.allDone = false;
				}

				$scope.ready = true;
			});
		});
	}
	$scope.reload();
});

monitoolControllers.controller('InputEditController', function($scope, $routeParams, $q, mtDatabase, mtInput, mtIndicators) {
	// Retrieve values and description for this form.
	mtDatabase.query('monitool/project_by_center', {key: $routeParams.centerId, include_docs: true}).then(function(result) {
		$scope.project = result.rows[0].doc;
		$scope.center  = $scope.project.center[$routeParams.centerId];
		$scope.period  = $routeParams.month;

		$q.all([
			mtInput.getFormValues($routeParams.centerId, $routeParams.month),
			mtIndicators.getPlanningDescription($scope.project, $routeParams.month)
		]).then(function(result) {
			$scope.values = result[0];
			$scope.indicators = result[1];
		});
	});

	// Update all indicator on each change until there are no more changes.
	$scope.evaluate = function() {
		mtIndicators.evaluate($scope.indicators, $scope.values);
	};

	// An indicator is disabled when there exists one instance of it that is calculated in the whole form.
	// !!!!!!!!!!!!!!!! Writing this here is stupid. it should be a property of the input.
	$scope.isDisabled = function(indicatorId) {
		return $scope.indicators.some(function(indicator) {
			return (indicatorId === indicator.id && indicator.compute) ||
				indicator.dependencies.some(function(indicator) {
					return indicatorId === indicator.id && indicator.compute;
				});
		});
	};

	$scope.save = function() {
		mtInput.saveFormValues($routeParams.centerId, $routeParams.month, $scope.values);
	};
});


///////////////////////////
// Reporting
///////////////////////////

monitoolControllers.controller('ReportingByEntitiesController', function($scope, mtDatabase, mtStatistics) {
	var now = new Date();
	$scope.end = period(now);
	now.setFullYear(now.getFullYear() - 1);
	$scope.begin = period(now);
	
	$scope.entityTypes = ['project', 'center'];
	$scope.selectedEntityType = {selected: 'project'};

	$scope.entities = [];
	$scope.selectedEntities = {selected: []};

	// load indicators / centers / projects to fill select box.
	$scope.updateList = function() {
		mtDatabase.query('monitool/by_type', {key: $scope.selectedEntityType.selected}).then(function(data) {
			$scope.entities = data.rows.map(function(row) { return row.value; });
			$scope.selectedEntities = [];

			if ($scope.selectedEntities.length)
				$scope.updateData();
			else
				$scope.statistics = [];
		});
	};

	$scope.updateData = function() {
		var ids = $scope.selectedEntities.selected.map(function(entity) { return entity._id || entity.id; });

		mtStatistics
			.getStatistics($scope.selectedEntityType.selected, ids, $scope.begin, $scope.end)
			.then(function(statistics) {
				$scope.statistics = statistics;
			});
	};

	$scope.updateList();
});











	// mainMethod: {
	// 	type: "formula",
	// 	formulaId: 2349238402938490
	// },
	// dependencyMethods: {
	// 	32897892478932: {
	// 		local/global/formula
	// 	},
	// 	23489023849023: {

	// 	},
	// 	24892738947289: {

	// 	},
	// 	23894028394083: {

	// 	}
	// }

