"use strict";

angular.module('monitool.controllers.project', [])

	.controller('ProjectListController', function($scope, projects, themes) {
		$scope.themes         = themes;
		$scope.pred           = 'name'; // default sorting predicate
		
		$scope.runningProjects  = projects.filter(function(p) { return p.end >= new Date() });
		$scope.finishedProjects = projects.filter(function(p) { return p.end < new Date() });
		$scope.projects         = $scope.runningProjects;
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

	.controller('ProjectLogicalFrameController', function($scope, themes) {
		// contains description of indicators for the loaded project.
		$scope.themes = themes;

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
	})


	.controller('ProjectInputEntitiesController', function($scope, $filter, Input, project) {
		$scope.createEntity = function() {
			$scope.project.inputEntities.push({id: makeUUID(), name: ''});
		};

		$scope.deleteEntity = function(entityId) {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_entity", entityId: entityId}).$promise.then(function(inputIds) {
				var question = $filter('translate')('project.delete_entity', {num_inputs: inputIds.length}),
					answer = $filter('translate')('project.delete_entity_answer', {num_inputs: inputIds.length});

				var really = inputIds.length == 0 || (inputIds.length && window.prompt(question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really) {
					$scope.project.inputEntities = $scope.project.inputEntities.filter(function(e) { return e.id !== entityId; });
					$scope.project.inputGroups.forEach(function(group) {
						var index = group.members.indexOf(entityId);
						if (index !== -1)
							group.members.splice(index, 1);
					});
				}
			});
		};

		$scope.createGroup = function() {
			$scope.project.inputGroups.push({id: makeUUID(), name: '', members: []});
		};

		$scope.deleteGroup = function(inputEntityId) {
			$scope.project.inputGroups = 
				$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
		};
	})


	.controller('ProjectManualInputListController', function($scope, project, inputs) {
		// $scope.inputs = inputs;
		$scope.pred = 'period';

		$scope.finishedInputs = inputs.filter(function(i) { return i.filled == 'yes'; });
		$scope.waitingInputs = inputs.filter(function(i) { return i.filled == 'no'; });
		$scope.invalidInputs = inputs.filter(function(i) { return i.filled == 'invalid'; });
		$scope.inputs = $scope.waitingInputs;
	})

	.controller('ProjectManualInputStructureController', function($scope, $state, $filter, Input, form, indicatorsById) {
		$scope.master = angular.copy(form);
		$scope.form = angular.copy(form); // FIXME one of those copies looks useless.
		$scope.indicatorsById = indicatorsById;
		$scope.formIndex = $scope.project.dataCollection.findIndex(function(f) {
			return f.id === form.id;
		});

		$scope.addIntermediary = function() {
			if (-1 === $scope.form.intermediaryDates.findIndex(function(key) { return !key; }))
				$scope.form.intermediaryDates.push(null);
		};

		$scope.removeIntermediary = function(index) {
			$scope.form.intermediaryDates.splice(index, 1);
		};

		$scope.delete = function() {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_form", formId: $scope.form.id}).$promise.then(function(inputIds) {
				console.log(inputIds)
				var easy_question = $filter('translate')('project.delete_form_easy'),
					hard_question = $filter('translate')('project.delete_form_hard', {num_inputs: inputIds.length}),
					answer = $filter('translate')('project.delete_form_hard_answer', {num_inputs: inputIds.length});

				var really = (inputIds.length == 0 && window.confirm(easy_question))
					|| (inputIds.length && window.prompt(hard_question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really) {
					$scope.project.dataCollection.splice($scope.formIndex, 1);
					$scope.formIndex = -1;
					$scope.$parent.save().then(function() {
						$state.go('main.project.manual_input_list');
					});
				}
			});
		};

		$scope.$watch('form.aggregatedData', function(aggregatedData) {
			$scope.maxPartitions = 0;
			aggregatedData.forEach(function(section) {
				section.elements.forEach(function(element) {
					$scope.maxPartitions = Math.max(element.partitions.length, $scope.maxPartitions);
				});
			});
		}, true);

		$scope.newSection = function(target) {
			target.push({id: makeUUID(), name: "", elements: []});
		};

		$scope.newVariable = function(target) {
			target.push({id: makeUUID(), name: "", partitions: [], geoAgg: 'sum', timeAgg: 'sum'});
		};

		$scope.newPartition = function(target) {
			target.push([]);
		};

		$scope.newPartitionElement = function(target) {
			target.push({id: makeUUID(), name: ""});
		};

		$scope.upSection = function(index) {
			if (index == 0)
				throw new Error();

			var element = $scope.form.aggregatedData[index];

			$scope.form.aggregatedData[index] = $scope.form.aggregatedData[index - 1];
			$scope.form.aggregatedData[index - 1] = element;
		};

		$scope.downSection = function(index) {
			if (index == $scope.form.aggregatedData.length - 1)
				throw new Error();

			var element = $scope.form.aggregatedData[index];
			$scope.form.aggregatedData[index] = $scope.form.aggregatedData[index + 1];
			$scope.form.aggregatedData[index + 1] = element;
		};

		$scope.upElement = function(index, parentIndex) {
			var element = $scope.form.aggregatedData[parentIndex].elements[index];
			$scope.form.aggregatedData[parentIndex].elements.splice(index, 1);

			if (index == 0)
				$scope.form.aggregatedData[parentIndex - 1].elements.push(element);
			else
				$scope.form.aggregatedData[parentIndex].elements.splice(index - 1, 0, element);
		};

		$scope.downElement = function(index, parentIndex) {
			var element = $scope.form.aggregatedData[parentIndex].elements[index];
			$scope.form.aggregatedData[parentIndex].elements.splice(index, 1);

			if ($scope.form.aggregatedData[parentIndex].elements.length == index)
				$scope.form.aggregatedData[parentIndex + 1].elements.unshift(element);
			else
				$scope.form.aggregatedData[parentIndex].elements.splice(index + 1, 0, element);
		};

		$scope.remove = function(item, target) {
			var index = target.findIndex(function(arrItem) {
				return item.id === arrItem.id;
			});

			if (index !== -1)
				target.splice(index, 1)
		};

		$scope.save = function() {
			// replace or add the form in the project.
			if ($scope.formIndex === -1) {
				$scope.formIndex = $scope.project.dataCollection.length
				$scope.project.dataCollection.push(angular.copy($scope.form));
			}
			else
				$scope.project.dataCollection[$scope.formIndex] = angular.copy($scope.form);

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

	.controller('ProjectManualInputDataController', function($scope, $state, mtReporting, form, inputs, indicatorsById) {
		$scope.form          = form;
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.previousInput = inputs.previous;
		$scope.inputEntity   = $scope.project.inputEntities.find(function(entity) { return entity.id == $scope.currentInput.entity; });

		$scope.save = function() {
			$scope.currentInput.$save(function() { $state.go('main.project.manual_input_list'); });
		};

		$scope.$watch('currentInput', function(v) {
			console.log(v);
		}, true)

		$scope.delete = function() {
			$scope.currentInput.$delete(function() { $state.go('main.project.manual_input_list'); });
		};
	})

	.controller('ProjectAggregatedDataReportingController', function($scope, $state, Input, mtReporting) {

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// those 2 hashes represent what the user sees.
		$scope.presentation = {plot: false};
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
				inputsPromise = Input.fetchFromQuery(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				$scope.stats = mtReporting.computeRawDataReporting(inputs, newQuery);
				$scope.cols = mtReporting.getColumns(newQuery);

				// console.log($scope.stats)

			});
		}, true)
	})
	

	.controller('ProjectReportingController', function($scope, $state, Input, mtReporting, indicatorsById) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// This hash allow opening and closing raw datas.
		$scope.open = {};

		// those 2 hashes represent what the user sees.
		$scope.presentation = {plot: false, display: $state.current.data.display || 'value' };
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
				inputsPromise = Input.fetchFromQuery(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				$scope.stats = mtReporting.computeProjectReporting(inputs, newQuery, indicatorsById);
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
				templateUrl: 'partials/projects/reporting/analysis-select-data.html',
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
			project: $scope.project,
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
				inputsPromise = mtReporting.getPreprocessedInputs(newQuery);

			// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
			inputsPromise.then(function(inputs) {
				stats = mtReporting.getProjectReporting(inputs, newQuery, indicatorsById);
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
	})

	.controller('ProjectIndicatorSelectionController', function($scope, $q, $modal, indicatorsById) {
		$scope.indicatorsById = indicatorsById;
		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId, target) {
			var indicatorIdPromise;
			if (indicatorId === 'new')
				indicatorIdPromise = $modal.open({
					controller: 'ProjectIndicatorSelectionModalController',
					templateUrl: 'partials/projects/indicators/selection-modal.html',
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
						controller: 'ProjectIndicatorEditionModalController',
						templateUrl: 'partials/projects/indicators/edition-modal.html',
						size: 'lg',
						scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
						resolve: {indicatorId: function() { return chosenIndicatorId; }, target: function() { return target; }}
					});
			});
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


	.controller('ProjectIndicatorSelectionModalController', function($scope, $modalInstance, mtRemoveDiacritics, forbiddenIds, hierarchy) {
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

	.controller('ProjectIndicatorEditionModalController', function($scope, $modalInstance, mtFetch, indicatorId, target) {
		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.planning = angular.copy($scope.project.indicators[indicatorId]) || {
			relevance: '',
			baseline: null,
			target: null,
			showRed: 33,
			showYellow: 66,
			
			formula: null,
			variable: null,
			filter: []
		};

		// Init display helper variable
		$scope.isNew = !$scope.project.indicators[indicatorId];
		$scope.isDetachable = !!target;
		$scope.baselineUnknown = $scope.planning.baseline === null;
		$scope.targetUnknown = $scope.planning.target === null;

		// Create list of data sources
		$scope.sources = [{id: null, name: "---", group: null}];
		$scope.project.dataCollection.forEach(function(form) {
			form.aggregatedData.forEach(function(section) {
				section.elements.forEach(function(element) {
					$scope.sources.push({id: element.id, name: element.name, group: section.name, element: element});
				});
			});
		});

		// Load the indicator if it's a new one. Take is from the hash if not.
		if ($scope.indicatorsById[indicatorId])
			$scope.indicator = $scope.indicatorsById[indicatorId];
		else // we also store it in the hash for future usage in ProjectLogicalFrameController
			mtFetch.indicator(indicatorId).then(function(indicator) {
				$scope.indicatorsById[indicatorId] = $scope.indicator = indicator;
			});

		// Gui interaction
		$scope.$watch('baselineUnknown', function(value) {
			$scope.planning.baseline = value ? null : 33;
		});

		$scope.$watch('targetUnknown', function(value) {
			$scope.planning.target = value ? null : 66;
		});

		$scope.$watch('planning.formula', function(formulaId) {
			if (formulaId == null) {
				delete $scope.planning.parameters;

				$scope.planning.variable = null;
				$scope.planning.filter = [];
			}
			else if (!$scope.planning.parameters) {
				delete $scope.planning.variable;
				delete $scope.planning.filter;

				$scope.planning.parameters = {};
				for (var key in $scope.indicator.formulas[formulaId].parameters)
					$scope.planning.parameters[key] = {id: null, filter: []}
			}
		})

		$scope.getElement = function(id) {
			var numForms = $scope.project.dataCollection.length;
			for (var i = 0; i < numForms; ++i) {
				var form = $scope.project.dataCollection[i],
					numSections = form.aggregatedData.length;

				for (var j = 0; j < numSections; ++j) {
					var section = form.aggregatedData[j],
						numElements = section.elements.length;

					for (var k = 0; k < numElements; ++k)
						if (section.elements[k].id === id)
							return section.elements[k];
				}
			}
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.planning, $scope.project.indicators[indicatorId]);
		};

		$scope.save = function() {
			// This should be done on the ProjectLogicalFrameController?
			if ($scope.isNew)
				target && target.push(indicatorId);

			// we need to change the project now, because we've been working on a copy of the indicator's planning
			$scope.project.indicators[indicatorId] = $scope.planning;
			$modalInstance.close();
		};

		$scope.detach = function() {
			target && target.splice(target.indexOf(indicatorId), 1);
			$modalInstance.close();
		};

		$scope.delete = function() {
			// Remove from logframe.
			target && target.splice(target.indexOf(indicatorId), 1);

			// Remove from plannings.
			delete $scope.project.indicators[indicatorId];

			// Remove from all forms that have a reference to it.
			$scope.project.dataCollection.forEach(function(form) {
				var numFields = form.fields.length;
				for (var i = 0; i < numFields; ++i)
					if (form.fields[i].indicatorId == indicatorId) {
						form.fields.splice(i, 1);
						return;
					}

			});

			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.close();
		};
	})

	.controller('ProjectExportController', function($scope) {
		
	});

