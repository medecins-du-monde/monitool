"use strict";

angular.module('monitool.controllers.project', [])

	.controller('ProjectListController', function($scope, projects) {
		$scope.projects       = projects;
		$scope.filterFinished = true;
		$scope.now            = moment().format('YYYY-MM');
		$scope.pred           = 'name'; // default sorting predicate

		$scope.isDisplayed = function(project) {
			return $scope.showFinished || project.end > $scope.now;
		};
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, project, mtDatabase) {
		if ($stateParams.projectId === 'new')
			project.owners.push($scope.userCtx.name);

		$scope.project = project;
		$scope.master = angular.copy(project);

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
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
	})

	.controller('ProjectLogicalFrameController', function($scope, $state, $q, $modal, indicatorsById) {
		// contains description of indicators for the loaded project.
		$scope.indicatorsById = indicatorsById;

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId, target) {
			if (indicatorId === 'new')
				indicatorId = $modal.open({templateUrl: 'partials/indicators/selector-popup.html', controller: 'IndicatorChooseController', size: 'lg'}).result;
			else
				indicatorId = $q.when(indicatorId);

			indicatorId.then(function(indicatorId) {
				$state.go('main.project.logical_frame.indicator_edit', {indicatorId: indicatorId, target: target});
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
	})

	/**
	 * This controller is a modal and DOES NOT inherit from ProjectLogicalFrameController
	 * Hence the need for project and userCtx to be passed explicitly.
	 */
	.controller('ProjectLogicalFrameIndicatorController', function($scope, $modalInstance, mtDatabase, project, userCtx, indicatorId, target) {
		// Retrieve indicator array where we need to add or remove indicator ids.
		var getIndicatorsList = function() {
			var path = target.split('.');
			if (path.length === 1)
				return $scope.project.logicalFrame.indicators;
			else if (path.length === 2)
				return $scope.project.logicalFrame.purposes[path[1]].indicators;
			else
				return $scope.project.logicalFrame.purposes[path[1]].outputs[path[2]].indicators;
		};

		$scope.project  = project;
		$scope.userCtx  = userCtx;
		$scope.isNew    = !project.indicators[indicatorId];
		$scope.planning = angular.copy(project.indicators[indicatorId]) || {
			relevance: '', baseline: 0,
			minimum: 0, orangeMinimum: 20, greenMinimum: 40,
			greenMaximum: 60, orangeMaximum: 80, maximum: 100,
			targets: []
		};

		mtDatabase.current.get(indicatorId).then(function(indicator) {
			$scope.indicator = indicator;
		});

		$scope.addTarget = function() {
			$scope.planning.targets.push({period: null, value: 0});
		};

		$scope.removeTarget = function(target) {
			$scope.planning.targets.splice($scope.planning.targets.indexOf(target), 1);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.planning, $scope.project.indicators[indicatorId]);
		};

		$scope.save = function() {
			if ($scope.container.isNew)
				getIndicatorsList().push(indicatorId);

			$scope.project.indicators[indicatorId] = $scope.planning;
			$modalInstance.close();
		};

		$scope.delete = function() {
			var indicators = getIndicatorsList();
			indicators.splice(indicators.indexOf(indicatorId), 1);
			delete $scope.project.indicators[indicatorId];
			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.close();
		};
	})

	.controller('ProjectInputEntitiesController', function($scope, project, mtDatabase) {
		$scope.create = function() {
			$scope.project.inputEntities.push({id: PouchDB.utils.uuid().toLowerCase(), name: ''});
		};

		$scope.delete = function(inputEntityId) {
			var message = 'Si vous supprimez un lieu d\'activité vous perdrez toutes les saisies associées. Tapez "supprimer" pour confirmer';

			if (prompt(message) == 'supprimer') {
				$scope.project.inputEntities = 
					$scope.project.inputEntities.filter(function(entity) { return entity.id !== inputEntityId; });
			}
		};
	})

	.controller('ProjectInputGroupsController', function($scope, project, mtDatabase) {
		$scope.create = function() {
			$scope.project.inputGroups.push({id: PouchDB.utils.uuid().toLowerCase(), name: ''});
		};

		$scope.delete = function(inputEntityId) {
			$scope.project.inputGroups = 
				$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
		};
	})

	.controller('ProjectFormsController', function($scope, project) {
		$scope.noFormsYet = Object.keys(project.dataCollection).length === 0;
	})

	.controller('ProjectFormEditionController', function($scope, $state, $stateParams, mtDatabase, project, indicatorsById) {
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

		$scope.reset();
		$scope.indicatorsById = indicatorsById;
	})

	.controller('ProjectInputListController', function($scope, project, inputs) {
		$scope.inputs = inputs;
	})

	.controller('ProjectInputController', function($state, $stateParams, $scope, mtDatabase, mtReporting, project, inputs) {
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
			mtReporting.evaluateScope($scope.form, $scope.input.indicators);
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
	})

	.controller('ProjectReportingController', function($scope, $stateParams, mtReporting, type, project, indicatorsById) {
		var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});

		$scope.indicatorsById = indicatorsById;
		$scope.begin          = moment().subtract(1, 'year').format('YYYY-MM');
		$scope.end            = moment().format('YYYY-MM');
		$scope.groupBy        = 'month';
		$scope.display        = 'value';
		$scope.plots          = {};

		if ($scope.begin < $scope.project.begin)
			$scope.begin = $scope.project.begin;

		if ($scope.end > moment().format('YYYY-MM'))
			$scope.end = moment().format('YYYY-MM');

		// Retrieve inputs
		$scope.updateData = function() {
			$scope.entity = $scope.group = null;

			var data;
			if (type === 'project')
				data = mtReporting.getProjectStats($scope.project, $scope.begin, $scope.end, $scope.groupBy);
			else if (type === 'entity') {
				data = mtReporting.getEntityStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.entityId);
				$scope.entity = $scope.project.inputEntities.filter(function(e) { return e.id == $stateParams.entityId; })[0];
			}
			else if (type === 'group') {
				data = mtReporting.getGroupStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.groupId);
				$scope.group = $scope.project.inputGroups.filter(function(g) { return g.id == $stateParams.groupId; })[0];
			}

			$scope.cols = mtReporting.getStatsColumns($scope.project, $scope.begin, $scope.end, $scope.groupBy, type, $stateParams[type=='group'?'groupId':'entityId']);
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
			var csvDump = mtReporting.exportProjectStats($scope.cols, $scope.project, $scope.indicatorsById, $scope.data),
				blob    = new Blob([csvDump], {type: "text/csv;charset=utf-8"}),
				name    = [$scope.project.name, $scope.begin, $scope.end].join('_') + '.csv';

			saveAs(blob, name);
		};

		$scope.updateData();
	})

	.controller('ProjectUserListController', function($scope, mtDatabase, project, users) {
		$scope.users = users;	
	});
