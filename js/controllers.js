"use strict";

var monitoolControllers = angular.module(
	'MonitoolControllers',
	[
		'ui.bootstrap',
		'ui.select',
		'ui.bootstrap.showErrors',
		'angularMoment',

	]
);


monitoolControllers.controller('LoginController', function($scope, $location, mtDatabase, mtStatus) {
	$scope.tryLogin = function() {
		mtDatabase.remote.login($scope.login, $scope.password).then(function(user) {
			$scope.userInfo.name = user.lastname;

		}).catch(function(error) {
			console.log('login failed')
		});
	};
});


monitoolControllers.controller('MenuController', function($scope, $location, mtDatabase, mtStatus) {
	// Application startup
	// $location.url('/');

	// // Try to log user in from local credentials
	// $scope.userInfo = {};
	// mtDatabase.local.get('_local/credentials').then(function(cred) {
	// 	return mtDatabase.remote.login(cred.login, cred.password);
	// }).then(function(user) {
	// 	$scope.userInfo.name = user.lastname;
	// }).catch(function(error) {
	// 	$location.url('login');
	// });


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
	$scope.projects       = projects;
	$scope.filterFinished = true;
	$scope.now            = moment().format('YYYY-MM');
	$scope.pred           = 'name'; // default sorting predicate

	$scope.isFinished = function(project) {
		return !$scope.filterFinished || project.end > $scope.now;
	};

	$scope.create = function() {
		$location.url('/projects/new');
	};
});


monitoolControllers.controller('ProjectLogicalFrameController', function($location, $scope, $routeParams, $modal, mtDatabase, project) {
	$scope.project = project;
	$scope.master = angular.copy(project);

	mtDatabase.current.allDocs({include_docs: true, keys: Object.keys(project.indicators)}).then(function(result) {
		$scope.indicatorsById = {};
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});
	
	// handle indicator add, edit and remove in a modal window.
	$scope.editIndicator = function(indicatorId, target) {
		var modalInstance = $modal.open({
			templateUrl: 'partials/projects/logical-frame-indicator.html',
			controller: 'ProjectLogicalFrameIndicatorController',
			size: 'lg',
			resolve: {
				// why functions?
				indicatorId:  function() { return indicatorId },
				planning:     function() { return $scope.project.indicators[indicatorId] },
				forbiddenIds: function() { return Object.keys($scope.project.indicators) }
			}
		});

		modalInstance.result.then(function(result) {
			if (result.action === 'add' || result.action === 'edit')
				$scope.project.indicators[result.indicatorId] = result.indicator;
			else if (result.action === 'delete') {
				target.splice(target.indexOf(result.indicatorId));
				delete $scope.project.indicators[result.indicatorId];
			}
			if (result.action === 'add')
				target.push(result.indicatorId);

			mtDatabase.current.get(result.indicatorId).then(function(indicator) {
				$scope.indicatorsById[indicator._id] = indicator;
			});
		});
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

	$scope.removeActivity = function(activity, output) {
		output.activities.splice(output.activities.indexOf(activity), 1);
	};	

	// handle global form actions
	$scope.save = function() {
		if ($routeParams.projectId === 'new')
			$scope.project._id = PouchDB.utils.uuid().toLowerCase();

		mtDatabase.current.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);

			if ($routeParams.projectId === 'new')
				$location.url('/projects/' + result.id + '/logical-frame');
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


monitoolControllers.controller('ProjectLogicalFrameIndicatorController', function($scope, $q, $modalInstance, mtFetch, mtDatabase, indicatorId, planning, forbiddenIds) {
	$scope.container = {};
	$scope.container.isNew = !indicatorId;

	if ($scope.container.isNew)
		$q.all([mtFetch.indicatorHierarchy(forbiddenIds), mtFetch.typesById(), mtFetch.themesById()]).then(function(result) {
			$scope.indicatorHierarchy = result[0];
			$scope.types  = result[1];
			$scope.themes = result[2];
		});
	else
		mtDatabase.current.get(indicatorId).then(function(indicator) {
			$scope.container.indicator = indicator;
		});

	$scope.planning = planning || {
		relevance: '',
		baseline: 0,
		minimum: 0, orangeMinimum: 20, greenMinimum: 40, greenMaximum: 60, orangeMaximum: 80, maximum: 100,
		targets: []
	};

	$scope.add = function() {
		$modalInstance.close({action: 'add', indicatorId: $scope.container.indicator._id, indicator: $scope.planning});
	};

	$scope.save = function() {
		$modalInstance.close({action: 'edit', indicatorId: $scope.container.indicator._id, indicator: $scope.planning});
	};

	$scope.delete = function() {
		$modalInstance.close({action: 'delete', indicatorId: indicatorId});
	};

	$scope.cancel = function() { $modalInstance.dismiss('cancel'); };
});


monitoolControllers.controller('ProjectInputEntitiesController', function($scope, $location, project, mtDatabase) {
	$scope.project = project;
	$scope.master  = angular.copy(project);

	$scope.stats = function(inputEntityId) {
		$location.url('/projects/' + project._id + '/input-entities/' + inputEntityId);
	};

	$scope.delete = function(inputEntityId) {
		var message = 'Si vous supprimez un lieu d\'activité vous perdrez toutes les saisies associées. Tapez "supprimer" pour confirmer';

		if (prompt(message) == 'supprimer') {
			$scope.project.inputEntities = 
				$scope.project.inputEntities.filter(function(entity) { return entity.id !== inputEntityId; });
		}
	};

	$scope.create = function() {
		$scope.project.inputEntities.push({id: PouchDB.utils.uuid().toLowerCase(), name: ''});
	};

	$scope.save = function() {
		mtDatabase.current.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);
		}).catch(function(error) {
			$scope.error = error;
		});
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.project);
	};

	$scope.reset = function() {
		$scope.project = angular.copy($scope.master);
	};
});


monitoolControllers.controller('ProjectInputGroupsController', function($scope, $location, project, mtDatabase) {
	$scope.project = project;
	$scope.master  = angular.copy(project);

	$scope.stats = function(inputGroupId) {
		$location.url('/projects/' + project._id + '/input-groups/' + inputGroupId);
	};

	$scope.delete = function(inputEntityId) {
		$scope.project.inputGroups = 
			$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
	};

	$scope.create = function() {
		$scope.project.inputGroups.push({id: PouchDB.utils.uuid().toLowerCase(), name: ''});
	};

	$scope.save = function() {
		mtDatabase.current.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);
		}).catch(function(error) {
			$scope.error = error;
		});
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.project);
	};

	$scope.reset = function() {
		$scope.project = angular.copy($scope.master);
	};});


monitoolControllers.controller('ProjectFormsController', function($scope, $location, $routeParams, project, mtDatabase) {
	$scope.project = project;

	$scope.edit = function(formId) {
		$location.url('/projects/' + $routeParams.projectId + '/forms/' + formId);
	};
});


monitoolControllers.controller('ProjectFormEditionController', function($scope, $routeParams, $location, project, mtDatabase) {
	// Build indicator selection
	var rebuildChosenIndicators = function() {
		$scope.chosenIndicators = [];
		Object.keys($scope.project.indicators).forEach(function(indicatorId) {
			if ($scope.form.fields[indicatorId])
				$scope.chosenIndicators.push({id: indicatorId, selected: true, disabled: false});
			else {
				var disabled = false;
				$scope.project.dataCollection.forEach(function(form) {
					if (form.id !== $scope.form.id && form.fields[indicatorId])
						disabled = true;
				});
				$scope.chosenIndicators.push({id: indicatorId, selected: false, disabled: disabled});
			}
		});
	};

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
		mtDatabase.current.allDocs({include_docs: true, keys: toLoad}).then(function(result) {
			result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
		});
	};

	$scope.save = function() {
		mtDatabase.current.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);

			if ($routeParams.formId === 'new')
				$location.url('/projects/' + $scope.project._id + '/forms/' + $scope.form.id);
		}).catch(function(error) {
			$scope.error = error;
		});
	};

	$scope.reset = function() {
		$scope.project = angular.copy($scope.master);
		
		if ($routeParams.formId === 'new') {
			$scope.form = {
				id: PouchDB.utils.uuid().toLowerCase(),
				name: "",
				periodicity: "monthly",
				useProjectStart: true,
				useProjectEnd: true,
				fields: {}
			};
			$scope.project.dataCollection.push($scope.form);
		}
		else
			$scope.form = $scope.project.dataCollection.filter(function(form) {
				return form.id == $routeParams.formId;
			})[0];

		rebuildChosenIndicators();
	};

	$scope.isUnchanged = function() {
		return angular.equals($scope.master, $scope.project);
	};

	$scope.master = angular.copy(project);
	$scope.reset();

	// Retrieve indicators definition
	$scope.indicatorsById = {};
	Object.keys($scope.project.indicators).forEach(function(id) { $scope.indicatorsById[id] = true; });
	Object.keys($scope.form.fields).forEach(function(id) { $scope.indicatorsById[id] = true; });
	mtDatabase.current.allDocs({include_docs: true, keys: Object.keys($scope.indicatorsById)}).then(function(result) {
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});
});


monitoolControllers.controller('ProjectInputListController', function($scope, $location, project, inputs, mtDatabase) {
	$scope.project = project;
	$scope.inputs = [];

	project.inputEntities.forEach(function(inputEntity) {
		project.dataCollection.forEach(function(form) {
			var periods;
			if (form.periodicity == 'monthly' || form.periodicity == 'quarterly') {
				var current = moment(form.useProjectStart ? project.begin : form.begin, 'YYYY-MM'),
					end     = moment(form.useProjectEnd ? project.end : project.end, 'YYYY-MM');

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
				throw new Error(form.periodicity + ' is not a valid periodicity');

			periods.forEach(function(period) {
				$scope.inputs.push({
					filled: inputs[[$scope.project._id, inputEntity.id, form.id, period.format('YYYY-MM')].join(':')],
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


monitoolControllers.controller('ProjectInputController', function($scope, $routeParams, $location, project, inputs, mtDatabase) {
	$scope.project       = project;
	$scope.input         = inputs.current;
	$scope.previousInput = inputs.previous;

	$scope.form          = $scope.project.dataCollection.filter(function(form) { return form.id == $routeParams.formId; })[0];
	$scope.inputEntity   = project.inputEntities.filter(function(entity) { return entity.id == $scope.input.entity; })[0];

	// var colors = ["#F2B701", "#E57D04", "#DC0030", "#B10058", "#7C378A", "#3465AA", "#09A275", "#7CB854"];
	var colors = ['#FBB735', '#E98931', '#EB403B', '#B32E37', '#6C2A6A', '#5C4399', '#274389', '#1F5EA8', '#227FB0', '#2AB0C5', '#39C0B3'],
		curColorIndex = 0;

	$scope.colors = colors;

	var fields = [];
	for (var indicatorId in $scope.form.fields) {
		var field = $scope.form.fields[indicatorId];
		field.id = indicatorId;
		field.colors = [];
		if (project.indicators[indicatorId])
			field.colors.push(colors[(curColorIndex++) % colors.length]);
		fields.push(field);
	}

	for (var i = 0; i < 3; ++i)
		fields.forEach(function(field) {
			if (field.type !== 'computed')
				return;
			// retrieve all dependencies and add them all colors from the computed field.
			fields
				.filter(function(f) {
					for (var k in field.parameters)
						if (field.parameters[k] === f.id)
							return true;
					return false;
				})
				.forEach(function(f) {
					field.colors.forEach(function(color) {
						if (f.colors.indexOf(color) === -1)
							f.colors.push(color);
					});
				});
		});

	// sort colors in fields
	fields.forEach(function(field) {
		field.colors.sort(function(color1, color2) {
			return colors.indexOf(color1) - colors.indexOf(color2);
		});
	});


	// sort fields by colors
	fields.sort(function(field1, field2) {
		if (field1.type !== field2.type)
			return field1.type === 'computed' ? -1 : 1;
		 
		var length = Math.min(field1.colors.length, field2.colors.length);
		for (var i = 0; i < length; ++i) {
			var indexA = colors.indexOf(field1.colors[i]),
				indexB = colors.indexOf(field2.colors[i]);
			if (indexA != indexB)
				return indexA - indexB;
		}
		
		return field2.length - field1.length; // longer table goes last.
	});

	$scope.fields = fields;
	$scope.indicatorsById = {};
	mtDatabase.current.allDocs({include_docs: true, keys: Object.keys($scope.form.fields)}).then(function(result) {
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});

	$scope.evaluate = function() {
		var values = null, newValues = angular.copy($scope.input.indicators);

		while (!angular.equals(values, newValues)) {
			for (var indicatorId in $scope.form.fields) {
				var field = $scope.form.fields[indicatorId];
				if (field.type === 'computed') {
					var localScope = {};
					for (var paramName in field.parameters)
						localScope[paramName] = $scope.input.indicators[field.parameters[paramName]] || 0;
					$scope.input.indicators[indicatorId] = math.eval(field.expression, localScope);
				}
			}

			values    = newValues;
			newValues = $scope.input.indicators;
		}
	};

	$scope.copy = function(fieldId) {
		$scope.input.indicators[fieldId] = $scope.previousInput.indicators[fieldId];
		$scope.evaluate();
	};

	$scope.save = function() {
		mtDatabase.current.put($scope.input).then(function() {
			$location.url('projects/' + project._id + '/inputs');
		});
	};
});


monitoolControllers.controller('ProjectUserListController', function($scope) {

});

monitoolControllers.controller('ReportingController', function($scope, $routeParams, type, project, mtDatabase, mtIndicators) {
	var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});

	$scope.project = project;

	// Retrieve indicators
	$scope.indicatorsById = {};
	mtDatabase.current.allDocs({keys: Object.keys($scope.project.indicators), include_docs: true}).then(function(result) {
		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
	});

	$scope.begin   = moment().subtract(1, 'year').format('YYYY-MM');
	$scope.end     = moment().format('YYYY-MM');
	$scope.groupBy = 'month';
	$scope.display = 'value';
	$scope.plots   = {};

	if ($scope.begin < $scope.project.begin)
		$scope.begin = $scope.project.begin;

	if ($scope.end > moment().format('YYYY-MM'))
		$scope.end = moment().format('YYYY-MM');

	// Retrieve inputs
	$scope.updateData = function() {
		$scope.entity = $scope.group = null;

		var data;
		if (type === 'project')
			data = mtIndicators.getProjectStats($scope.project, $scope.begin, $scope.end, $scope.groupBy);
		else if (type === 'entity') {
			data = mtIndicators.getEntityStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $routeParams.entityId);
			$scope.entity = $scope.project.inputEntities.filter(function(e) { return e.id == $routeParams.entityId; })[0];
		}
		else if (type === 'group') {
			data = mtIndicators.getGroupStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $routeParams.groupId);
			$scope.group = $scope.project.inputGroups.filter(function(g) { return g.id == $routeParams.groupId; })[0];
		}

		$scope.cols = mtIndicators.getStatsColumns($scope.project, $scope.begin, $scope.end, $scope.groupBy, type, $routeParams[type=='group'?'groupId':'entityId']);
		data.then(function(data) {
			$scope.data = data;

			if ($scope.plot)
				$scope.updateGraph();
		});
	};

	$scope.updateGraph = function(changedIndicatorId) {
		var cols      = $scope.cols.filter(function(e) { return e.id != 'total' }).map(function(e) { return e.name; }),
			chartData = {
				type: $scope.groupBy === 'month' || $scope.groupBy === 'year' ? 'line' : 'bar',
				columns: [['x'].concat(cols)] // x-axis
			};

		if (changedIndicatorId && !$scope.plots[changedIndicatorId])
			chartData.unload = [$scope.indicatorsById[changedIndicatorId].name];

		for (var indicatorId in $scope.plots) {
			if ($scope.plots[indicatorId]) {
				// Retrieve name
				var column = [$scope.indicatorsById[indicatorId].name];

				// iterate on months, centers, etc
				$scope.cols.forEach(function(col) {
					if (col.id !== 'total') {
						if ($scope.data[col.id] && $scope.data[col.id][indicatorId])
							column.push($scope.data[col.id][indicatorId][$scope.display] || 0);
						else
							column.push(0);
					}
				});

				chartData.columns.push(column);
			}
		}

		chart.load(chartData);
	};

	$scope.downloadGraph = function() {
		var filename  = [$scope.project.name, $scope.begin, $scope.end].join('_') + '.png',
			sourceSVG = document.querySelector("svg");

		saveSvgAsPng(sourceSVG, filename, 1);
	};

	$scope.downloadCSV = function() {
		var csvDump = 'os;res;indicator';
		$scope.cols.forEach(function(col) { csvDump += ';' + col.name; })
		csvDump += "\n";

		$scope.project.logicalFrame.indicators.forEach(function(indicatorId) {
			csvDump += 'None;None;' + $scope.indicatorsById[indicatorId].name;
			$scope.cols.forEach(function(col) {
				csvDump += ';';
				try { csvDump += $scope.data[col.id][indicatorId].value }
				catch (e) {}
			});
			csvDump += "\n";

			$scope.project.logicalFrame.purposes.forEach(function(purpose) {
				purpose.indicators.forEach(function(indicatorId) {
					csvDump += purpose.description + ';None;' + $scope.indicatorsById[indicatorId].name;
					$scope.cols.forEach(function(col) {
						csvDump += ';';
						try { csvDump += $scope.data[col.id][indicatorId].value }
						catch (e) {}
					});
					csvDump += "\n";
				});

				purpose.outputs.forEach(function(output) {
					output.indicators.forEach(function(indicatorId) {
						csvDump += purpose.description + ';' + output.description + ';' + $scope.indicatorsById[indicatorId].name;
						$scope.cols.forEach(function(col) {
							csvDump += ';';
							try { csvDump += $scope.data[col.id][indicatorId].value }
							catch (e) {}
						});
						csvDump += "\n";
					});
				});
			});
		});

		var blob = new Blob([csvDump], {type: "text/csv;charset=utf-8"});
		var name = [$scope.project.name, $scope.begin, $scope.end].join('_') + '.csv';
		saveAs(blob, name);
	};

	$scope.updateData();
});


///////////////////////////
// Indicators
///////////////////////////


monitoolControllers.controller('IndicatorListController', function($scope, $q, $location, indicatorHierarchy, typesById, themesById) {
	$scope.hierarchy  = indicatorHierarchy;
	$scope.types      = typesById;
	$scope.themes     = themesById;
	$scope.orderField = 'name';

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

		mtDatabase.current.put($scope.indicator).then(function(result) {
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
	$scope.indicators = indicators.filter(function(i) { return i._id != indicator._id });
	$scope.types      = types;
	$scope.themes     = themes;
});


monitoolControllers.controller('IndicatorReportingController', function($scope, indicator, projects, mtIndicators) {
	var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});

	$scope.indicator = indicator;
	$scope.projects = projects;

	$scope.begin   = moment().subtract(1, 'year').format('YYYY-MM');
	$scope.end     = moment().format('YYYY-MM');
	$scope.groupBy = 'month';
	$scope.display = 'value';
	$scope.plots   = {};

	if ($scope.end > moment().format('YYYY-MM'))
		$scope.end = moment().format('YYYY-MM');

	var getName = function(entityId) {
		var numProjects = $scope.projects.length;
		for (var i = 0; i < numProjects; ++i) {
			if ($scope.projects[i]._id == entityId)
				return $scope.projects[i].name;

			var numEntities = $scope.projects[i].inputEntities.length;
			for (var j = 0; j < numEntities; ++j)
				if ($scope.projects[i].inputEntities[j].id === entityId)
					return $scope.projects[i].inputEntities[j].name;
		}
	};

	// Retrieve inputs
	$scope.updateData = function() {
		$scope.cols = mtIndicators.getStatsColumns(null, $scope.begin, $scope.end, $scope.groupBy, null, null);

		mtIndicators.getIndicatorStats($scope.indicator, $scope.projects, $scope.begin, $scope.end, $scope.groupBy).then(function(data) {
			$scope.data = data;
			if ($scope.plot)
				$scope.updateGraph();
		});
	};

	$scope.updateGraph = function(changedEntityId) {
		var cols      = $scope.cols.filter(function(e) { return e.id != 'total' }).map(function(e) { return e.name; }),
			chartData = {type: 'line', columns: [['x'].concat(cols)]};

		if (changedEntityId && !$scope.plots[changedEntityId])
			chartData.unload = [getName(changedEntityId)];

		for (var entityId in $scope.plots) {
			if ($scope.plots[entityId]) {
				// Retrieve name
				var column = [getName(entityId)];

				// iterate on months, centers, etc
				$scope.cols.forEach(function(col) {
					if (col.id !== 'total') {
						if ($scope.data[col.id] && $scope.data[col.id][entityId] && $scope.data[col.id][entityId][indicator._id])
							column.push($scope.data[col.id][entityId][indicator._id][$scope.display] || 0);
						else
							column.push(0);
					}
				});

				chartData.columns.push(column);
			}
		}

		chart.load(chartData);
	};

	$scope.downloadCSV = function() {
		var csvDump = 'type;nom';

		// header
		$scope.cols.forEach(function(col) { csvDump += ';' + col.name; })
		csvDump += "\n";

		$scope.projects.forEach(function(project) {
			csvDump += 'project;' + project.name;
			$scope.cols.forEach(function(col) {
				csvDump += ';';
				try { csvDump += $scope.data[col.id][project._id][indicator._id].value }
				catch (e) {}
			});
			csvDump += "\n";

			project.inputEntities.forEach(function(entity) {
				csvDump += 'entity;' + entity.name;
				$scope.cols.forEach(function(col) {
					csvDump += ';';
					try { csvDump += $scope.data[col.id][project._id][indicator._id].value; }
					catch (e) {}
				});
				csvDump += "\n";
			});
		});

		var blob = new Blob([csvDump], {type: "text/csv;charset=utf-8"});
		var name = [indicator.name, $scope.begin, $scope.end].join('_') + '.csv';
		saveAs(blob, name);
	};

	$scope.downloadGraph = function() {
		var filename  = [indicator.name, $scope.begin, $scope.end].join('_') + '.png',
			sourceSVG = document.querySelector("svg");
			
		saveSvgAsPng(sourceSVG, filename, 1);
	};

	$scope.updateData();
});


/**
 * this controller and theme controller are the same, factorize it!
 */
monitoolControllers.controller('TypeListController', function($scope, types, mtDatabase) {
	$scope.types = types;

	$scope.add = function() {
		var newType = {_id: PouchDB.utils.uuid().toLowerCase(), type: 'type', name: $scope.newType || ''};
		newType.name = newType.name.trim();

		$scope.newType = '';
		if (newType.name.length && !$scope.types.filter(function(type) { return type.name == newType.name; }).length) {
			$scope.types.push(newType)
			mtDatabase.current.put(newType);
		}
	};

	$scope.remove = function(type) {
		$scope.types = $scope.types.filter(function(lType) { return lType !== type });
		mtDatabase.current.get(type._id).then(function(type) {
			mtDatabase.current.remove(type);
		});
	};
});


monitoolControllers.controller('ThemeListController', function($scope, themes, mtDatabase) {
	$scope.themes = themes;

	$scope.add = function() {
		var newTheme = {_id: PouchDB.utils.uuid().toLowerCase(), type: 'theme', name: $scope.newTheme || ''};
		newTheme.name = newTheme.name.trim();

		$scope.newTheme = '';
		if (newTheme.name.length && !$scope.themes.filter(function(theme) { return theme.name == newTheme.name; }).length) {
			$scope.themes.push(newTheme)
			mtDatabase.current.put(newTheme);
		}
	};

	$scope.remove = function(theme) {
		$scope.themes = $scope.themes.filter(function(lTheme) { return lTheme !== theme });
		mtDatabase.current.get(theme._id).then(function(theme) {
			mtDatabase.current.remove(theme);
		})
	};
});
