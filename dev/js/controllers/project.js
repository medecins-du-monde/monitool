"use strict";

var projectControllers = angular.module(
	'monitool.controllers.project',
	[
		'ui.bootstrap',
		'ui.select',
		'ui.bootstrap.showErrors',
		'angularMoment'
	]
);

projectControllers.controller('ProjectListController', function($scope, projects) {
	$scope.projects       = projects;
	$scope.filterFinished = true;
	$scope.now            = moment().format('YYYY-MM');
	$scope.pred           = 'name'; // default sorting predicate

	$scope.isFinished = function(project) {
		return !$scope.filterFinished || project.end > $scope.now;
	};
});

projectControllers.controller('ProjectMenuController', function($scope, $state, project) {
	$scope.project = project;
});


projectControllers.controller('ProjectLogicalFrameController', function($scope, $modal, $state, $stateParams, mtDatabase, project, indicatorsById) {
	$scope.project = project;
	$scope.master = angular.copy(project);
	$scope.indicatorsById = indicatorsById;

	// handle indicator add, edit and remove in a modal window.
	$scope.editIndicator = function(indicatorId, target) {
		var modalInstance = $modal.open({
			templateUrl: 'partials/projects/logical-frame-indicator.html',
			controller: 'ProjectLogicalFrameIndicatorController',
			size: 'lg',
			resolve: {
				indicatorId:  function() { return indicatorId; },
				planning:     function() { return $scope.project.indicators[indicatorId]; },
				forbiddenIds: function() { return Object.keys($scope.project.indicators); }
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
		if ($stateParams.projectId === 'new')
			$scope.project._id = PouchDB.utils.uuid().toLowerCase();

		mtDatabase.current.put($scope.project).then(function(result) {
			$scope.project._rev = result.rev;
			$scope.master = angular.copy($scope.project);

			if ($stateParams.projectId === 'new')
				$state.go('main.project.logical_frame', {projectId: result.id});
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


projectControllers.controller('ProjectLogicalFrameIndicatorController', function($scope, $q, $modalInstance, mtFetch, mtDatabase, indicatorId, planning, forbiddenIds) {
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

	$scope.addTarget = function() {
		$scope.planning.targets.push({period: null, value: 0});
	};

	$scope.removeTarget = function(target) {
		$scope.planning.targets.splice($scope.planning.targets.indexOf(target), 1);
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


projectControllers.controller('ProjectInputEntitiesController', function($scope, project, mtDatabase) {
	$scope.project = project;
	$scope.master  = angular.copy(project);

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


projectControllers.controller('ProjectInputGroupsController', function($scope, project, mtDatabase) {
	$scope.project = project;
	$scope.master  = angular.copy(project);

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


projectControllers.controller('ProjectFormsController', function($scope, project) {
	$scope.project = project;
});

projectControllers.controller('ProjectFormEditionController', function($scope, $stateParams, $state, project, mtDatabase) {
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

			if ($stateParams.formId === 'new')
				$state.go('main.project.form', {formId: $scope.form.id});
		}).catch(function(error) {
			$scope.error = error;
		});
	};

	$scope.reset = function() {
		$scope.project = angular.copy($scope.master);
		
		if ($stateParams.formId === 'new') {
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
				return form.id == $stateParams.formId;
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


projectControllers.controller('ProjectInputListController', function($scope, project, inputs, mtDatabase) {
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
});


projectControllers.controller('ProjectInputController', function($state, $stateParams, $scope, project, inputs, mtDatabase) {
	$scope.project       = project;
	$scope.input         = inputs.current;
	$scope.previousInput = inputs.previous;

	$scope.form          = $scope.project.dataCollection.filter(function(form) { return form.id == $stateParams.formId; })[0];
	$scope.inputEntity   = project.inputEntities.filter(function(entity) { return entity.id == $scope.input.entity; })[0];

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
			$state.go('main.project.input_list');
		});
	};
});


projectControllers.controller('ProjectUserListController', function($scope) {

});



projectControllers.controller('ReportingController', function($scope, $stateParams, type, project, mtDatabase, mtIndicators) {
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
			data = mtIndicators.getEntityStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.entityId);
			$scope.entity = $scope.project.inputEntities.filter(function(e) { return e.id == $stateParams.entityId; })[0];
		}
		else if (type === 'group') {
			data = mtIndicators.getGroupStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.groupId);
			$scope.group = $scope.project.inputGroups.filter(function(g) { return g.id == $stateParams.groupId; })[0];
		}

		$scope.cols = mtIndicators.getStatsColumns($scope.project, $scope.begin, $scope.end, $scope.groupBy, type, $stateParams[type=='group'?'groupId':'entityId']);
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
