"use strict";

angular.module('monitool.controllers.project', [])

	.controller('ProjectListController', function($scope, projects, themes) {
		$scope.projects       = projects;
		$scope.themes         = themes;
		$scope.filterFinished = true;
		$scope.now            = new Date();
		$scope.pred           = 'name'; // default sorting predicate

		$scope.isDisplayed = function(project) {
			return $scope.showFinished || project.end > $scope.now;
		};
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, project, mtFetch) {
		if ($stateParams.projectId === 'new') {
			project.owners.push($scope.userCtx._id);
			project.dataEntryOperators.push($scope.userCtx._id);
		}

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

		$scope.$on('languageChange', function(e) {
			// @hack that will make copies of all dates, and force datepickers to redraw...
			$scope.project = angular.copy($scope.project);
		});

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

	.controller('ProjectLogicalFrameController', function($scope, $state, $q, $modal, indicatorsById, themes) {
		// contains description of indicators for the loaded project.
		$scope.indicatorsById = indicatorsById;
		$scope.themes = themes;

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId, target) {
			var indicatorIdPromise;
			if (indicatorId === 'new')
				indicatorIdPromise = $modal.open({
					controller: 'ProjectLogicalFrameIndicatorSelectionController',
					templateUrl: 'partials/projects/logical-frame-indicator-selector.html',
					size: 'lg',
					scope: $scope,
					resolve: {
						forbiddenIds: function() { return target ? $scope.getAssignedIndicators() : Object.keys($scope.project.indicators); },
						hierarchy: function(mtFetch) { return mtFetch.themes({mode: 'tree', partial: '1'}); }
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
						controller: 'ProjectLogicalFrameIndicatorEditionController',
						templateUrl: 'partials/projects/logical-frame-indicator-edition.html',
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

		$scope.isExternal = function(indicatorId) {
			return $scope.project.themes.filter(function(theme) {
				return $scope.indicatorsById[indicatorId].themes.indexOf(theme) !== -1
			}).length === 0;
		};

		$scope.$watch('project', function(project) {
			$scope.otherIndicators = $scope.getUnassignedIndicators();
		}, true);
	})

	.controller('ProjectLogicalFrameIndicatorSelectionController', function($scope, $modalInstance, forbiddenIds, hierarchy) {
		$scope.forbidden = forbiddenIds;
		$scope.hierarchy = hierarchy;

		$scope.choose = function(indicatorId) {
			$modalInstance.close(indicatorId);
		};

		$scope.cancel = function() {
			$modalInstance.dismiss()
		};
	})

	.controller('ProjectLogicalFrameIndicatorEditionController', function($scope, $modalInstance, mtFetch, indicatorId, target) {
		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.isNew = !$scope.project.indicators[indicatorId];
		$scope.planning = angular.copy($scope.project.indicators[indicatorId]) || {
			relevance: '', baseline: null, target: null, showRed: 33, showYellow: 66
		};
		$scope.planning.__baselineUnknown = $scope.planning.baseline === null;
		$scope.planning.__targetUnknown = $scope.planning.target === null;

		// FIXME, this query is useless, we could avoid it and pass the full indicator from the calling controller.
		mtFetch.indicator(indicatorId).then(function(indicator) {
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

			delete $scope.planning.__baselineUnknown;
			delete $scope.planning.__targetUnknown;

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
		$scope.pred = 'period';

		$scope.isDisplayed = function(input) {
			return input.filled == 'no' || input.filled == 'invalid' || $scope.showFinished;
		};
	})

	.controller('ProjectInputController', function($scope, $state, mtForms, form, indicatorsById, inputs) {
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
				var planning  = $scope.project.indicators[field.id],
					indicator = indicatorsById[field.id],
					value = $scope.currentInput.values[field.model];

				if (planning.target === null || planning.baseline === null || value === undefined || value === null)
					$scope.status[field.id] = 'unknown';
				else {
					var progress;
					if (indicator.target === 'around_is_better')
						progress = 100 * (1 - Math.abs(value - planning.target) / (planning.target - planning.baseline));
					else
						progress = 100 * (value - planning.baseline) / (planning.target - planning.baseline);

					if (progress < planning.showRed)
						$scope.status[field.id] = 'red';
					else if (progress < planning.showYellow)
						$scope.status[field.id] = 'orange';
					else
						$scope.status[field.id] = 'green';
				}
			});
		}, true);

		$scope.save = function() {
			$scope.currentInput.$save(function() { $state.go('main.project.input_list'); });
		};

		$scope.delete = function() {
			$scope.currentInput.$delete(function() { $state.go('main.project.input_list'); });
		};
	})

	.controller('ProjectReportingController', function($scope, $state, $stateParams, mtReporting, mtForms, indicatorsById) {
		$scope.entity                  = $scope.project.inputEntities.find(function(e) { return e.id === $stateParams.id; });
		$scope.group                   = $scope.project.inputGroups.find(function(g) { return g.id === $stateParams.id; });
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

		// @hack
		$scope.$on('languageChange', function(e) { $scope.dates = angular.copy($scope.dates); });

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
			$scope.data = mtReporting.regroup($scope.inputs, $scope.query, indicatorsById);
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
