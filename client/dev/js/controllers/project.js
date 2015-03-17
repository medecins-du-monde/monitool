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

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, project, mtFetch) {
		if ($stateParams.projectId === 'new') {
			project.owners.push($scope.userCtx._id);
			project.dataEntryOperators.push($scope.userCtx._id);
		}

		$scope.project = project;
		$scope.master = angular.copy(project);

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			if ($stateParams.projectId === 'new')
				$scope.project._id = makeUUID();

			return $scope.project.$save().then(function() {
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
			var assignedIndicators = $scope.getAssignedIndicators();
			return Object.keys($scope.project.indicators).filter(function(indicatorId) {
				return assignedIndicators.indexOf(indicatorId) === -1;
			});
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.input_entities', 'main.project.input_groups', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.stay_here_check')))
					event.preventDefault();
				else
					$scope.reset();
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
			output.activities.push({description: ""});
		};

		$scope.removeActivity = function(activity, output) {
			output.activities.splice(output.activities.indexOf(activity), 1);
		};

		$scope.isExternal = function(indicatorId) {
			// FIXME: Use !$scope.project.themes.some(is internal)
			return $scope.project.themes.filter(function(theme) {
				return $scope.indicatorsById[indicatorId].themes.indexOf(theme) !== -1
			}).length === 0;
		};

		$scope.$watch('project', function(project) {
			$scope.otherIndicators = $scope.getUnassignedIndicators();
		}, true);
	})

	.controller('ProjectLogicalFrameIndicatorSelectionController', function($scope, $modalInstance, mtRemoveDiacritics, forbiddenIds, hierarchy) {
		$scope.forbidden = forbiddenIds;
		$scope.hierarchy = hierarchy;
		$scope.searchField = '';

		$scope.missingIndicators = {};
		hierarchy.forEach(function(theme) {
			if ($scope.project.themes.indexOf(theme._id) !== -1)
				theme.children.forEach(function(type) {
					type.children.forEach(function(indicator) {
						if (!$scope.project.indicators[indicator._id] && indicator.operation === 'mandatory')
							$scope.missingIndicators[indicator._id] = indicator;
					});
				});
		});
		$scope.missingIndicators = Object.keys($scope.missingIndicators).map(function(id) { return $scope.missingIndicators[id]; });

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

		// Load the indicator if it's a new one. Take is from the hash if not.
		if ($scope.indicatorsById[indicatorId])
			$scope.indicator = $scope.indicatorsById[indicatorId];
		else
			mtFetch.indicator(indicatorId).then(function(indicator) {
				// we also store it in the hash for future usage in ProjectLogicalFrameController
				$scope.indicatorsById[indicatorId] = $scope.indicator = indicator;
			});

		// if this indicator is already used in a form, we can't delete it from the logical frame.
		$scope.isDeletable = $scope.project.dataCollection.every(function(form) {
			return form.fields.every(function(field) { return field.indicatorId !== indicatorId; });
		});

		$scope.isUnchanged = function() {
			return angular.equals($scope.planning, $scope.project.indicators[indicatorId]);
		};

		$scope.save = function() {
			// This should be done on the ProjectLogicalFrameController?
			if ($scope.isNew)
				target && target.push(indicatorId);

			// we delete this to avoid changing the $scope.isUnchanged() value if we did nothing with the indicator.
			delete $scope.planning.__baselineUnknown;
			delete $scope.planning.__targetUnknown;

			// we need to change the project now, because we've been working on a copy of the indicator's planning
			$scope.project.indicators[indicatorId] = $scope.planning;
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
			$scope.project.inputEntities.push({id: makeUUID(), name: ''});
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
			$scope.project.inputGroups.push({id: makeUUID(), name: '', members: []});
		};

		$scope.delete = function(inputEntityId) {
			$scope.project.inputGroups = 
				$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
		};
	})

	.controller('ProjectFormsController', function($scope, indicatorsById) {
		$scope.colors = ['#FBB735', '#E98931', '#EB403B', '#B32E37', '#6C2A6A', '#5C4399', '#274389', '#1F5EA8', '#227FB0', '#2AB0C5', '#39C0B3'];
		$scope.colors = ["#F2B701", "#E57D04", "#DC0030", "#B10058", "#7C378A", "#3465AA", "#09A275", "#7CB854"].reverse();
		$scope.indicatorsById = indicatorsById;

		// we retrieve all relevant dates.
		var relevantDates = [
			moment($scope.project.begin).format('YYYY-MM-DD'),
			moment($scope.project.end).format('YYYY-MM-DD')
		];

		$scope.project.dataCollection.forEach(function(form) {
			[form.start, form.end].concat(form.intermediaryDates).forEach(function(jsDate) {
				if (jsDate) {
					var date = moment(jsDate).format('YYYY-MM-DD');
					relevantDates.indexOf(date) === -1 && relevantDates.push(date);
				}
			});
		});
		relevantDates.sort();

		// Then retrieve all intervals.
		var intervals = [];
		for (var i = 0; i < relevantDates.length - 1; ++i)
			intervals.push(relevantDates[i] + ' ' + relevantDates[i + 1]);

		var indicators = {};
		$scope.project.dataCollection.forEach(function(form, index) {
			form.fields.forEach(function(field) {
				if (!indicators[field.indicatorId])
					indicators[field.indicatorId] = [];

				var id     = form.id,
					color  = $scope.colors[index],
					begin  = moment(form.start).format('YYYY-MM-DD'),
					end    = moment(form.end).format('YYYY-MM-DD'),
					length = relevantDates.indexOf(end) - relevantDates.indexOf(begin);

				indicators[field.indicatorId].push({id: id, name: form.name, color: color, begin: begin, end: end, length: length});
			});
		});

		var result = [];
		for (var indicatorId in $scope.project.indicators) {
			var rowResult = [], lastIndex = 0;
			var h = indicators[indicatorId] || [];

			h.sort(function(a, b) { return a.begin.localeCompare(b.begin); });
			h.forEach(function(usage) {
				// push empty slot.
				if (relevantDates.indexOf(usage.begin) !== lastIndex) {
					rowResult.push({length: relevantDates.indexOf(usage.begin) - lastIndex });
					lastIndex = relevantDates.indexOf(usage.begin);
				}

				// push filled slot.
				rowResult.push(usage);
				lastIndex = relevantDates.indexOf(usage.end);
			});

			if (lastIndex < intervals.length)
				rowResult.push({length: intervals.length - lastIndex });

			result.push({
				id: indicatorId,
				usage: rowResult
			});
		}

		$scope.intervals = intervals;
		$scope.usages = result;
	})

	.controller('ProjectFormEditionController', function($scope, $stateParams, form, indicatorsById) {
		$scope.master = angular.copy($scope.form);
		$scope.form = angular.copy(form);
		$scope.indicatorsById = indicatorsById;

		$scope.addIntermediary = function() {
			if (-1 === $scope.form.intermediaryDates.findIndex(function(key) { return !key; }))
				$scope.form.intermediaryDates.push(null);
		};

		$scope.removeIntermediary = function(index) {
			$scope.form.intermediaryDates.splice(index, 1);
		};

		$scope.save = function() {
			// replace or add the form in the project.
			var index = $scope.project.dataCollection.findIndex(function(form) { return form.id === $scope.form.id; });
			if (index === -1)
				$scope.project.dataCollection.push(angular.copy($scope.form));
			else
				$scope.project.dataCollection[index] = angular.copy($scope.form);

			// call ProjectMenuController save method.
			return $scope.$parent.save().then(function() {
				$scope.master = angular.copy($scope.form);
			});
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.form);
		};

		$scope.reset = function() {
			$scope.form = angular.copy($scope.master);
		};
	})

	.controller('ProjectInputListController', function($scope, project, inputs) {
		$scope.inputs = inputs;
		$scope.pred = 'period';

		$scope.isDisplayed = function(input) {
			return input.filled == 'no' || input.filled == 'invalid' || $scope.showFinished;
		};
	})

	.controller('ProjectInputController', function($scope, $state, mtReporting, mtCompute, mtRegroup, form, inputs, indicatorsById) {
		$scope.form          = form;
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.previousInput = inputs.previous;
		$scope.inputEntity   = $scope.project.inputEntities.find(function(entity) { return entity.id == $scope.currentInput.entity; });

		// insure that model is properly initialised, but don't remove existing data
		$scope.form.rawData.forEach(function(section) {
			section.elements.forEach(function(element) {
				if (element.partition1.length != 0 && element.partition2.length == 0)
					inputs.current.values[element.id] = inputs.current.values[element.id] || {};
				else if (element.partition1.length != 0 && element.partition2.length != 0) {
					inputs.current.values[element.id] = inputs.current.values[element.id] || {};
					element.partition1.forEach(function(p1) {
						inputs.current.values[element.id][p1.id] = inputs.current.values[element.id][p1.id] || {};
					})
				}
			});
		});

		// this should not be here, and we seriouly have to make those work on focusout to save cpu cycles.
		$scope.$watch('currentInput.values', function() {
			var input = angular.copy($scope.currentInput),
				query = {
					project: $scope.project,
					begin: moment(input.period).format('YYYY-MM-DD'),
					end: moment(input.period).format('YYYY-MM-DD'),
					groupBy: 'month',
					type: "entity",
					id: input.entity
				};

			input.compute = mtCompute.computeIndicatorsLeafsFromRaw(input.values, form);
			input.aggregation = mtRegroup.computeAggregationFields(input, $scope.project);

			$scope.presentation = {display: 'value'};
			$scope.stats = mtReporting.getProjectReporting([input], query, indicatorsById);
		}, true);

		$scope.save = function() {
			$scope.currentInput.$save(function() { $state.go('main.project.input_list'); });
		};

		$scope.delete = function() {
			$scope.currentInput.$delete(function() { $state.go('main.project.input_list'); });
		};
	})

	.controller('ProjectReportingController', function($scope, $state, mtReporting, indicatorsById) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};
		
		// those 2 hashes represent what the user sees.
		$scope.presentation = {plot: false, display: 'value'};
		$scope.query = {
			project: $scope.project,
			begin:   mtReporting.getDefaultStartDate($scope.project),
			end:     mtReporting.getDefaultEndDate($scope.project),
			groupBy: 'month', type: 'project', id: ''
		};

		// Update loaded inputs when query.begin or query.end changes.
		var inputsPromise = null;
		$scope.$watch('query', function(newQuery, oldQuery) {
			// if anything besides groupBy changes, we need to refetch.
			// FIXME: we could widely optimize this.
			if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end || oldQuery.id !== newQuery.id)
				inputsPromise = mtReporting.getPreprocessedInputs(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				$scope.stats = mtReporting.getProjectReporting(inputs, newQuery, indicatorsById);
			});
		}, true)
	})

	.controller('ProjectReportingAnalysisListController', function($scope, reports) {
		$scope.reports = reports;
	})

	.controller('ProjectReportingAnalysisController', function($scope, $state, $stateParams, $modal, report, project, indicatorsById) {
		$scope.report = report;
		$scope.master = angular.copy(report);
		
		$scope.addReportGrid = function(index) {
			$modal.open({
				controller: 'ProjectReportingAnalysisDataSelectionController',
				templateUrl: 'partials/projects/reporting-analysis-select-data.html',
				size: 'lg', scope: $scope, resolve: { indicatorsById: function() { return indicatorsById; } }
			}).result.then(function(result) {
				result.type = 'data';
				$scope.report.elements.splice(index, 0, result);
			});
		};

		$scope.addReportText = function(index) {
			$scope.report.elements.splice(index, 0, {
				type: "text",
				content: ""
			});
		};

		$scope.move = function(index, delta) {
			var elements = $scope.report.elements.splice(index, 1);
			$scope.report.elements.splice(index + delta, 0, elements[0]);
		};

		$scope.remove = function(index) {
			$scope.report.elements.splice(index, 1);
		};

		$scope.save = function() {
			if ($stateParams.reportId === 'new')
				$scope.report._id = makeUUID();

			$scope.report.$save().then(function() {
				$scope.master = angular.copy($scope.report);
				
				if ($stateParams.reportId === 'new')
					$state.go('main.project.reporting_analysis', {reportId: $scope.report._id});
			}).catch(function(error) {
				$scope.error = error;
			});
		};

		$scope.reset = function() {
			$scope.report = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.report, $scope.master);
		}
	})

	// FIXME this needs a rewriting. The code is way too kludgy
	.controller('ProjectReportingAnalysisDataSelectionController', function($scope, $modalInstance, mtReporting, indicatorsById) {
		$scope.query = {
			project: mtReporting.getAnnotatedProjectCopy($scope.project, indicatorsById),
			begin:   mtReporting.getDefaultStartDate($scope.project),
			end:     mtReporting.getDefaultEndDate($scope.project),
			groupBy: 'month', type: 'project', id: ''
		};
		$scope.availableIndicators = Object.keys($scope.project.indicators).map(function(i) { return indicatorsById[i]; });
		$scope.container = {chosenIndicatorIds: []};

		var stats = {cols: [], rows: []};
		$scope.result = {display: "both"};

		var update = function() {
			$scope.result.stats = angular.copy(stats);
			$scope.result.stats.rows = $scope.result.stats.rows.filter(function(row) {
				return $scope.container.chosenIndicatorIds.indexOf(row.id) !== -1;
			});
			$scope.result.query = {
				begin: $scope.query.begin,
				end: $scope.query.end,
				groupBy: $scope.query.groupBy,
				type: $scope.query.type,
				id: $scope.query.id
			};
		};

		// Update loaded inputs when query.begin or query.end changes.
		var inputsPromise = null;
		$scope.$watch('query', function(newQuery, oldQuery) {
			// if anything besides groupBy changes, we need to refetch.
			// FIXME: we could widely optimize this.
			if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end || oldQuery.id !== newQuery.id)
				inputsPromise = mtReporting.getInputs(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				stats = mtReporting.regroup(inputs, newQuery, indicatorsById);
				update();
			});
		}, true)

		$scope.$watch('container.chosenIndicatorIds', update, true)

		$scope.choose = function(indicatorId) {
			$modalInstance.close($scope.result);
		};

		$scope.cancel = function() {
			$modalInstance.dismiss()
		};
	})

	.controller('ProjectUserListController', function($scope, users) {
		$scope.users = users;
	});
