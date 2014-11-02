"use strict";

var monitoolControllers = angular.module(
	'MonitoolControllers',
	[
		'MonitoolServices',
		'ui.bootstrap',
		'ui.select',
		'ui.bootstrap.showErrors',
		'angularMoment',
		'nvd3ChartDirectives'
	]
);


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


monitoolControllers.controller('ProjectLogicalFrameController', function($location, $scope, $routeParams, mtDatabase, project) {
	$scope.project = project;
	$scope.master = angular.copy(project);

	mtDatabase.allDocs({include_docs: true, keys: Object.keys(project.indicators)}).then(function(result) {
		$scope.indicatorsById = {};
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});
	
	// handle indicator add and remove
	$scope.addIndicator = function(target) {
	};

	$scope.removeIndicator = function(indicatorId, target) {
	};

	// handle purpose add and remove
	$scope.addPurpose = function() {
		$scope.project.logicalFrame.purposes.push({
			description: "", assumptions: "", indicators: [], outputs: []});
	};

	$scope.removePurpose = function(purpose) {
		$scope.project.logicalFrame.purposes.splice(
			$scope.project.logicalFrame.purposes.indexOf(purpose), 1
		);
	};

	// handle output add and remove
	$scope.addOutput = function(purpose) {
		purpose.outputs.push({
			description: "", assumptions: "", indicators: [], activities: []});
	};

	$scope.removeOutput = function(output, purpose) {
		purpose.outputs.splice(purpose.outputs.indexOf(output), 1);
	};

	// handle output add and remove
	$scope.addActivity = function(output) {
		output.activities.push({description: "", prerequisites: ""});
	};

	$scope.removeOutput = function(activity, output) {
		output.activities.splice(output.activities.indexOf(activity), 1);
	};	

	// handle global form actions
	$scope.save = function() {
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


monitoolControllers.controller('ProjectInputEntitiesController', function($scope, project, inputsByCenterId, mtDatabase) {
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


monitoolControllers.controller('ProjectInputGroupsController', function($scope, project, mtDatabase) {
	$scope.project = project;
});


monitoolControllers.controller('ProjectFormsController', function($scope, $location, $routeParams, project, mtDatabase) {
	$scope.project = project;

	$scope.edit = function(formId) {
		$location.url('/projects/' + $routeParams.projectId + '/forms/' + formId);
	};
});


monitoolControllers.controller('ProjectFormEditionController', function($scope, $routeParams, project, mtDatabase) {
	$scope.project = project;
	$scope.form    = project.dataCollection.filter(function(form) { return form.id == $routeParams.formId; })[0];

	// Retrieve indicators definition
	$scope.indicatorsById = {};
	Object.keys($scope.project.indicators).forEach(function(id) { $scope.indicatorsById[id] = true; });
	Object.keys($scope.form.fields).forEach(function(id) { $scope.indicatorsById[id] = true; });
	mtDatabase.allDocs({include_docs: true, keys: Object.keys($scope.indicatorsById)}).then(function(result) {
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});

	// Build indicator selection
	$scope.chosenIndicators = [];
	Object.keys($scope.project.indicators).forEach(function(indicatorId) {
		if ($scope.form.fields[indicatorId])
			$scope.chosenIndicators.push({id: indicatorId, selected: true, disabled: false});
		else {
			var disabled = false;
			project.dataCollection.forEach(function(form) {
				if (form.id !== $scope.form.id && form.fields[indicatorId])
					disabled = true;
			});
			$scope.chosenIndicators.push({id: indicatorId, selected: false, disabled: disabled});
		}
	});

	$scope.updateFields = function() {
		// Retrieve all dependencies of a given indicator, with duplicates (which we do not care about).
		var getDependenciesRec = function(indicatorId) {
			var list  = [indicatorId],
				field = $scope.form.fields[indicatorId];
			if (field.type === 'computed')
				for (var key in field.parameters)
					list = getDependenciesRec(field.parameters[key]).concat(list);
			return list;
		};

		var chosenIndicatorIds = $scope.chosenIndicators.filter(function(i) { return i.selected; }).map(function(i) { return i.id; });
		var usedIndicators = [];

		chosenIndicatorIds.forEach(function(indicatorId) {
			// if a new indicator was added in the list, add it to fields
			if (!$scope.form.fields[indicatorId])
				$scope.form.fields[indicatorId] = {type: 'manual'};

			// traverse dependency tree to remove redundant indicators
			usedIndicators = getDependenciesRec(indicatorId).concat(usedIndicators);
		});

		// remove redundant
		Object.keys($scope.form.fields).forEach(function(indicatorId) {
			if (usedIndicators.indexOf(indicatorId) === -1)
				delete $scope.form.fields[indicatorId];
		});
	};

	$scope.useFormula = function(indicatorId, formulaId) {
		var field   = $scope.form.fields[indicatorId],
			formula = $scope.indicatorsById[indicatorId].formulas[formulaId];

		field.type = 'computed';
		field.expression = formula.expression;
		field.parameters = formula.parameters;

		var toLoad = [];
		for (var parameterName in field.parameters) {
			var indicatorId = field.parameters[parameterName];
			if (!$scope.form.fields[indicatorId]) {
				$scope.form.fields[indicatorId] = {type: 'manual'};
				toLoad.push(indicatorId);
			}
		}
		mtDatabase.allDocs({include_docs: true, keys: toLoad}).then(function(result) {
			result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
		});
	};

});

monitoolControllers.controller('ProjectInputListController', function($scope, $location, project, inputs) {
	$scope.project = project;
	$scope.inputs = [];

	

	project.inputEntities.forEach(function(inputEntity) {
		project.dataCollection.forEach(function(form) {
			var periods;
			if (form.periodicity == 'monthly' || form.periodicity == 'quarterly') {
				var current = moment(form.begin || project.begin),
					end     = moment(form.end || project.end);

				if (end.isAfter()) // do not allow to go in the future
					end = moment();

				periods = [];
				while (current.isBefore(end)) {
					periods.push(current.clone());
					current.add(form.periodicity === 'monthly' ? 1 : 3, 'month');
				}
			}
			else if (form.periodicity === 'planned') {
				periods = form.periods;
			}
			else
				throw new Error();

			periods.forEach(function(period) {
				$scope.inputs.push({
					filled: false,
					period: period,
					formId: form.id, formName: form.name,
					inputEntityId: inputEntity.id, inputEntityName: inputEntity.name
				});
			});
		});
	});

	$scope.inputs.sort(function(a, b) {
		if (a.period.isSame(b.period)) {
			var nameCmp = a.inputEntityName.localeCompare(b.inputEntityName);
			return nameCmp !== 0 ? nameCmp : a.formName.localeCompare(b.formName);
		}
		else
			return a.period.isBefore(b.period) ? -1 : 1;
	});

	$scope.makeInput = function(i) {
		$location.url('projects/' + project._id + '/input/' + i.period.format('YYYY-MM') + '/' + i.formId + '/' + i.inputEntityId);
	};

});

monitoolControllers.controller('ProjectInputController', function($scope, project, input) {
	$scope.project = project;
	$scope.input   = input;


});

monitoolControllers.controller('ProjectUserListController', function($scope) {

});

monitoolControllers.controller('ReportingController', function($scope, type, entity, mtDatabase) {
	$scope.project = entity;
	$scope.reportingData = [
		{key:"Here is a long indicator descriptor with many mnay letters", values:[["2014-01", 34], ["2014-02", 24], ["2014-03", 14], ["2014-04", 19], ["2014-05", 34], ["2014-06", 45]]},
		{key:"Here is a long indicator descriptor with many mnay lettersHere is a long indicator descriptor with many mnay letters", values:[["2014-01", 24], ["2014-02", 14], ["2014-03", 19], ["2014-04", 45], ["2014-05", 34], ["2014-06", 34]]},
	];

	// Retrieve indicators
	$scope.indicatorsById = {};
	mtDatabase.allDocs({keys: Object.keys($scope.project.indicators), include_docs: true}).then(function(result) {
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});

	// Retrieve inputs
	var options = {startkey: [$scope.project._id], endkey: [$scope.project._id, {}], reduce: true};
	mtDatabase.query('monitool/inputs_by_project_period', options).then(function(result) {
		console.log(result);
	});
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

