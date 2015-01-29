"use strict";

angular.module('monitool.controllers.project', [])

	.controller('ProjectListController', function($scope, projects) {
		$scope.projects       = projects;
		$scope.filterFinished = true;
		$scope.now            = new Date();
		$scope.pred           = 'name'; // default sorting predicate

		$scope.isDisplayed = function(project) {
			return $scope.showFinished || project.end > $scope.now;
		};
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, project, mtFetch) {
		if ($stateParams.projectId === 'new')
			project.owners.push($scope.userCtx.name);

		$scope.project = project;
		$scope.master = angular.copy(project);

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			if ($stateParams.projectId === 'new')
				$scope.project._id = PouchDB.utils.uuid().toLowerCase();

			$scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				
				if ($stateParams.projectId === 'new')
					$state.go('main.project.logical_frame', {projectId: $scope.project._id});
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

		$scope.getAssignedIndicators = function() {
			var result = [];
			result = $scope.project.logicalFrame.indicators.concat(result);
			$scope.project.logicalFrame.purposes.forEach(function(purpose) {
				result = purpose.indicators.concat(result);
				purpose.outputs.forEach(function(output) {
					result = output.indicators.concat(result);
				});
			});
			return result;
		};

		$scope.getUnassignedIndicators = function() {
			var otherIndicators = Object.keys($scope.project.indicators);
			$scope.getAssignedIndicators().forEach(function(indicatorId) {
				if (otherIndicators.indexOf(indicatorId) !== -1)
					otherIndicators.splice(otherIndicators.indexOf(indicatorId), 1);
			});
			return otherIndicators;
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.input_entities', 'main.project.input_groups', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm('Vous avez réalisé des modifications. Êtes-vous sûr de vouloir changer de page sans sauvegarder?'))
					$scope.reset();
				else
					event.preventDefault();
			}
		});
	})

	.controller('ProjectLogicalFrameController', function($scope, $state, $q, $modal, indicatorsById) {
		// contains description of indicators for the loaded project.
		$scope.indicatorsById = indicatorsById;

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId, target) {
			var indicatorIdPromise;
			if (indicatorId === 'new')
				indicatorIdPromise = $modal.open({
					templateUrl: 'partials/indicators/selector-popup.html',
					controller: 'IndicatorChooseController',
					size: 'lg',
					resolve: {
						forbiddenIds: function() { return target ? $scope.getAssignedIndicators() : Object.keys($scope.project.indicators); }
					}
				}).result;
			else
				indicatorIdPromise = $q.when(indicatorId);

			indicatorIdPromise.then(function(chosenIndicatorId) {
				// are we only reparenting an indicator?
				if (indicatorId === 'new' && $scope.project.indicators[chosenIndicatorId])
					// put it into new target
					target.push(chosenIndicatorId);
				else
					// edit.
					$modal.open({
						templateUrl: 'partials/projects/logical-frame-indicator.html',
						controller: 'ProjectLogicalFrameIndicatorController',
						size: 'lg',
						scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
						resolve: {indicatorId: function() { return chosenIndicatorId; }, target: function() { return target; }}
					});
			});
		};

		$scope.detachIndicator = function(indicatorId, target) {
			target.splice(target.indexOf(indicatorId), 1);
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

		$scope.$watch('project', function(project) {
			$scope.otherIndicators = $scope.getUnassignedIndicators();
		}, true);
	})

	/**
	 * This controller is a modal and DOES NOT inherit from ProjectLogicalFrameController
	 * Hence the need for project and userCtx to be passed explicitly.
	 */
	.controller('ProjectLogicalFrameIndicatorController', function($scope, $modalInstance, mtDatabase, indicatorId, target) {
		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.isNew = !$scope.project.indicators[indicatorId];
		$scope.planning = angular.copy($scope.project.indicators[indicatorId]) || {
			relevance: '', baseline: 0,
			minimum: 0, orangeMinimum: 20, greenMinimum: 40,
			greenMaximum: 60, orangeMaximum: 80, maximum: 100,
			targets: []
		};

		// FIXME, this query is useless, we could avoid it and pass the full indicator from the calling controller.
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
			if ($scope.isNew)
				target && target.push(indicatorId);

			$scope.project.indicators[indicatorId] = $scope.planning;
			$scope.indicatorsById[indicatorId] = $scope.indicator; // inject the indicator in the parent scope.
			$modalInstance.close();
		};

		$scope.delete = function() {
			target && target.splice(target.indexOf(indicatorId), 1);
			delete $scope.project.indicators[indicatorId];
			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.close();
		};
	})

	.controller('ProjectInputEntitiesController', function($scope, project) {
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

	.controller('ProjectInputGroupsController', function($scope, project) {
		$scope.create = function() {
			$scope.project.inputGroups.push({id: PouchDB.utils.uuid().toLowerCase(), name: '', members: []});
		};

		$scope.delete = function(inputEntityId) {
			$scope.project.inputGroups = 
				$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
		};
	})

	.controller('ProjectFormsController', function($scope, project) {
		$scope.noFormsYet = Object.keys(project.dataCollection).length === 0;
	})

	.controller('ProjectFormEditionController', function($scope, $stateParams, mtForms, form, indicatorsById, formulasById) {
		$scope.availableIndicators = [];
		$scope.container = { chosenIndicators: [] }; // we wrap chosenIndicators in a container for ui-select...

		// the db version it DRY, and a lot of information is missing for use to display it properly.
		// We make a copy and annotate it: the GUI will work with the copy.
		$scope.form = angular.copy(form);
		mtForms.annotateAllFormElements($scope.form.fields, indicatorsById);
		mtForms.buildLinks($scope.form.fields, indicatorsById);
		mtForms.buildSumability($scope.form.fields);
		$scope.master = angular.copy($scope.form);
		$scope.isNew = $stateParams.formId === 'new';
		$scope.container.chosenIndicatorIds = $scope.form.fields.map(function(field) { return field.id; });

		$scope.$watch("[form.useProjectStart, form.start, form.useProjectEnd, form.end]", function(newValue, oldValue) {
			if ($scope.form.useProjectStart)
				$scope.form.start = $scope.project.begin;

			if ($scope.form.useProjectEnd)
				$scope.form.end = $scope.project.end;

			// when begin and end change, we need to update the list of available indicators.
			// the user cannot choose an indicator which is already collected in the same period.
			$scope.availableIndicators = Object.keys($scope.project.indicators)
				.filter(function(indicatorId) {
					// look up other forms to check if the indicator is available
					var numForms = $scope.project.dataCollection.length;
					for (var index = 0; index < numForms; ++index) {
						var otherForm = $scope.project.dataCollection[index];

						if (otherForm.start > $scope.form.end)
							continue;
						
						if (otherForm.end < $scope.form.start)
							continue;

						if (otherForm.id !== $scope.form.id &&
							otherForm.fields.find(function(formElement) { return formElement.id === indicatorId; }))
							return false;
					}
					return true;
				})
				.map(function(indicatorId) { return indicatorsById[indicatorId]; });

			// Remove those indicators from the list of chosen ones.
			var keptIndicators = $scope.container.chosenIndicatorIds
				.filter(function(indicatorId) {
					return $scope.availableIndicators.find(function(i) { return i._id == indicatorId; });
				});

			if (keptIndicators.length !== $scope.container.chosenIndicatorIds.length) {
				if (confirm('Indicators will be removed because of collision. Are you sure?'))
					$scope.container.chosenIndicatorIds = keptIndicators;
				else {
					$scope.form.useProjectStart = oldValue[0];
					$scope.form.start = oldValue[1];
					$scope.form.useProjectEnd = oldValue[2];
					$scope.form.end = oldValue[3];
				}
			}
		}, true);

		// when chosenIndicators changes, we need to udate the form's fields
		$scope.$watchCollection('container.chosenIndicatorIds', function(newValue, oldValue) {
			var added   = newValue.filter(function(i) { return oldValue.indexOf(i) === -1; }),
				removed = oldValue.filter(function(i) { return newValue.indexOf(i) === -1; });

			// We just add an annotated manual input.
			added.forEach(function(indicatorId) {
				var formElement = {id: indicatorId, type: 'input', source: ''};
				mtForms.annotateFormElement(formElement, indicatorId, indicatorId, indicatorsById);

				// we need to test if the field is already there because of resets that triggers the watches...
				if (!$scope.form.fields.find(function(field) { return field.id === indicatorId; }))
					$scope.form.fields.push(formElement);
			});

			// Smart delete (by reparenting nodes if needed)
			removed.forEach(function(indicatorId) {
				var field = $scope.form.fields.find(function(element) { return element.id === indicatorId; });
				if (field)
				mtForms.deleteFormElement($scope.form.fields, field);
			});

			// available links are broken because we added/removed elements => rebuild them
			mtForms.buildLinks($scope.form.fields, indicatorsById);
			mtForms.buildSumability($scope.form.fields);
		});

		$scope.addIntermediary = function() {
			if (-1 === $scope.form.intermediaryDates.findIndex(function(key) { return !key; }))
				$scope.form.intermediaryDates.push(null);
		};

		$scope.removeIntermediary = function(index) {
			$scope.form.intermediaryDates.splice(index, 1);
		};

		$scope.move = function(index, direction) {
			var element = $scope.form.fields.splice(index, 1);
			// if (direction === 1)
				$scope.form.fields.splice(index + direction, 0, element[0]);
		};

		// now that's done, we only need to monitor changes on the types selects.
		$scope.sourceChanged = function(indicator) {
			if (indicator.type === 'input' || indicator.type.substring(0, 'link:'.length) === 'link:') {
				// FIXME we have to fix broken links if indicator type is a link

				for (var key in indicator.parameters)
					mtForms.deleteFormElement($scope.form.fields, indicator.parameters[key]);
				delete indicator.parameters; // must be an empty now.
			}
			else {
				var formula = formulasById[indicator.type.substring('compute:'.length)];
				indicator.parameters = {};
				for (var key in formula.parameters)
					indicator.parameters[key] = {type: "input", source: ''};
				mtForms.annotateFormElement(indicator, indicator.keyPath, indicator.indicatorPath, indicatorsById);
			}

			mtForms.buildLinks($scope.form.fields, indicatorsById);
			mtForms.buildSumability($scope.form.fields);
		};

		$scope.save = function() {
			$scope.master = angular.copy($scope.form);

			var formCopy = angular.copy($scope.form);
			mtForms.deAnnotateAllFormElements(formCopy.fields);

			// replace or add the form in the project.
			var index = $scope.project.dataCollection.findIndex(function(form) { return form.id === formCopy.id; });
			if (index === -1)
				$scope.project.dataCollection.push(formCopy);
			else
				$scope.project.dataCollection[index] = formCopy;

			// call ProjectMenuController save method.
			return $scope.$parent.save();
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.form);
		};

		$scope.reset = function() {
			$scope.form = angular.copy($scope.master);
			$scope.container.chosenIndicatorIds = $scope.master.fields.map(function(field) { return field.id; });
		};
	})

	.controller('ProjectInputListController', function($scope, project, inputs) {
		$scope.inputs = inputs;
	})

	.controller('ProjectInputController', function($scope, $state, mtForms, mtDatabase, form, indicatorsById, inputs) {
		$scope.form          = angular.copy(form);
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.previousInput = inputs.previous;
		$scope.inputEntity   = $scope.project.inputEntities.find(function(entity) { return entity.id == $scope.currentInput.entity; });

		mtForms.annotateAllFormElements($scope.form.fields, indicatorsById);

		$scope.status = {};
		$scope.$watch('currentInput.values', function() {
			mtForms.evaluateAll($scope.form.fields, $scope.currentInput.values);
			$scope.form.fields.forEach(function(field) {
				var indicatorMeta = $scope.project.indicators[field.id];

				if (indicatorMeta.greenMinimum < $scope.currentInput.values[field.model] && $scope.currentInput.values[field.model] < indicatorMeta.greenMaximum)
					$scope.status[field.id] = 'green';
				else if (indicatorMeta.orangeMinimum < $scope.currentInput.values[field.model] && $scope.currentInput.values[field.model] < indicatorMeta.orangeMaximum)
					$scope.status[field.id] = 'orange';
				else if (indicatorMeta.minimum < $scope.currentInput.values[field.model] && $scope.currentInput.values[field.model] < indicatorMeta.maximum)
					$scope.status[field.id] = 'red';
				else
					$scope.status[field.id] = 'darkred';
			});
		}, true);

		$scope.save = function() {
			mtDatabase.current.put($scope.currentInput).then(function() {
				$state.go('main.project.input_list');
			});
		};

		$scope.delete = function() {
			mtDatabase.current.remove($scope.currentInput).then(function() {
				$state.go('main.project.input_list');
			});
		};
	})

	.controller('ProjectReportingController', function($scope, $state, $stateParams, mtReporting, mtForms, indicatorsById) {
		$scope.entity                  = $scope.project.inputEntities.find(function(e) { return e.id === $state.current.data.id; });
		$scope.group                   = $scope.project.inputGroups.find(function(g) { return g.id === $state.current.data.id; });
		$scope.indicatorsById          = indicatorsById;
		$scope.unassignedIndicatorsIds = $scope.getUnassignedIndicators();

		// those 2 hashes represent what the user sees.
		$scope.presentation = {display: 'value', plot: false, colorize: false};
		$scope.query = {
			project: mtReporting.getAnnotatedProjectCopy($scope.project, indicatorsById),
			begin:   mtReporting.getDefaultStartDate($scope.project),
			end:     mtReporting.getDefaultEndDate($scope.project),
			groupBy: 'month',
			type:    $state.current.data.type,	// project/entity/group
			id:      $stateParams.id			// undefined/entityId/groupId
		};

		// h@ck
		$scope.dates = {begin: new Date($scope.query.begin), end: new Date($scope.query.end)};
		$scope.$watch("dates", function() {
			$scope.query.begin = moment($scope.dates.begin).format('YYYY-MM-DD');
			$scope.query.end = moment($scope.dates.end).format('YYYY-MM-DD');
		}, true);

		// Update loaded inputs when query.begin or query.end changes.
		$scope.inputs = [];
		$scope.$watch("[query.begin, query.end]", function() {
			mtReporting.getInputs($scope.query).then(function(inputs) {
				$scope.inputs = inputs;
			});
		}, true);

		// Update cols and data when grouping or inputs changes.
		$scope.$watch("[query.begin, query.end, query.groupBy, inputs]", function() {
			$scope.cols = mtReporting.getStatsColumns($scope.query);
			$scope.data = mtReporting.regroup($scope.inputs, $scope.query);
		}, true);

		// we should use a proper directive that relies on the scope instead of doing that in the controller with watches.
		var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});
		$scope.plots = {};
		$scope.$watch('[plots, query.begin, query.end, query.groupBy, inputs, presentation.display]', function(newValue, oldValue) {
			var allIndicatorsIds = [], removedIndicatorIds = [];
			Object.keys($scope.indicatorsById).forEach(function(indicatorId) {
				newValue[0][indicatorId] && allIndicatorsIds.push(indicatorId);
				!newValue[0][indicatorId] && oldValue[0][indicatorId] && removedIndicatorIds.push(indicatorId);
			});
			
			chart.load({
				type: ['year', 'month', 'week', 'day'].indexOf($scope.query.groupBy) !== -1 ? 'line' : 'bar',
				unload: removedIndicatorIds.map(function(indicatorId) { return $scope.indicatorsById[indicatorId].name; }),
				columns: [
						['x'].concat($scope.cols.filter(function(e) { return e.id != 'total' }).map(function(e) { return e.name; }))
					]
					.concat(allIndicatorsIds.map(function(indicatorId) {
						var column = [$scope.indicatorsById[indicatorId].name];
						$scope.cols.forEach(function(col) {
							if (col.id !== 'total') {
								if ($scope.data[col.id] && $scope.data[col.id][indicatorId])
									column.push($scope.data[col.id][indicatorId][$scope.presentation.display] || 0);
								else
									column.push(0);
							}
						});
						return column;
					}))
			});

			$scope.imageFilename = [$scope.query.project.name, $scope.query.begin, $scope.query.end].join('_') + '.png';
		}, true);
	})

	.controller('ProjectUserListController', function($scope, project, users) {
		$scope.users = users.map(function(user) { return user._id; });

		project.dataEntryOperators.concat(project.owners).forEach(function(username) {
			if ($scope.users.indexOf(username) === -1)
				$scope.users.push(username);
		});
	});
