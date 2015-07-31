"use strict";

angular.module('monitool.controllers.project.indicators', [])

	.controller('ProjectLogicalFrameController', function($scope, $q, $modal) {
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
		//////////////////
		// Init code
		//////////////////

		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.planning = angular.copy($scope.project.indicators[indicatorId]) || {
			relevance: '',
			baseline: null,
			target: null,
			formula: null,
			variable: null,
			filter: []
		};

		// Init display helper variable
		$scope.isNew = !$scope.project.indicators[indicatorId];
		$scope.isDetachable = !!target;

		// Load the indicator if it's a new one. Take is from the hash if not.
		if ($scope.indicatorsById[indicatorId])
			$scope.indicator = $scope.indicatorsById[indicatorId];
		else // we also store it in the hash for future usage in ProjectLogicalFrameController
			mtFetch.indicator(indicatorId).then(function(indicator) {
				$scope.indicatorsById[indicatorId] = $scope.indicator = indicator;
			});

		// Handle baseline and target
		$scope.baselineUnknown = $scope.planning.baseline === null;
		$scope.targetUnknown = $scope.planning.target === null;
		$scope.$watch('baselineUnknown', function(value) { $scope.planning.baseline = value ? null : 0; });
		$scope.$watch('targetUnknown', function(value) { $scope.planning.target = value ? null : 100; });

		$scope.$watch('planning.formula', function(formulaId, oldFormulaId) {
			if (formulaId !== oldFormulaId) {
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
						$scope.planning.parameters[key] = {variable: null, filter: []}
				}
			}
		});

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




	.controller('ProjectReportingController', function($scope, $state, inputs, mtReporting) {

		$scope.groupBy = 'month';

		// Create default filter so that all inputs are used.
		$scope.filters = {entityId: ""};
		$scope.filters.begin = new Date('9999-01-01T00:00:00Z')
		$scope.filters.end = new Date('0000-01-01T00:00:00Z');
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.filters.begin)
				$scope.filters.begin = inputs[i].period;
			if (inputs[i].period > $scope.filters.end)
				$scope.filters.end = inputs[i].period;
		}

		// When filter changes (or init), build the list of inputs to pass to the scope.
		$scope.$watch('filters', function() {
			// find a group that match the entityId.
			var entityFilter = null;
			if ($scope.filters.entityId) {
				var group = $scope.project.inputGroups.find(function(g) { return g.id == $scope.filters.entityId; });
				entityFilter = group ? group.members : [$scope.filters.entityId];
			}

			// ...rebuild usedInputs
			$scope.inputs = inputs.filter(function(input) {
				return input.period >= $scope.filters.begin
					&& input.period <= $scope.filters.end
					&& (!entityFilter || entityFilter.indexOf(input.entity) !== -1);
			});
		}, true);

		// when input list change, or regrouping is needed, compute table rows again.
		$scope.$watchGroup(['inputs', 'groupBy'], function() {
			var reporting = mtReporting.computeProjectIndicatorReporting($scope.inputs, $scope.project, $scope.groupBy, $scope.indicatorsById);
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end, $scope.filters.entityId, $scope.project)
			$scope.rows = [];

			var getStats = function(indent, indicatorId) {
				return {
					id: indicatorId,
					name: $scope.indicatorsById[indicatorId].name,
					unit: $scope.indicatorsById[indicatorId].unit,
					baseline: $scope.project.indicators[indicatorId].baseline,
					target: $scope.project.indicators[indicatorId].target,
					cols: $scope.cols.map(function(col) {
						return reporting[col.id] && reporting[col.id][indicatorId] !== undefined ? reporting[col.id][indicatorId] : null;
					}),
					type:'data',
					dataType: "indicator",
					indent: indent
				};
			};

			$scope.rows.push({type: 'header', text: $scope.project.logicalFrame.goal, indent: 0});
			Array.prototype.push.apply($scope.rows, $scope.project.logicalFrame.indicators.map(getStats.bind(null, 0)));
			$scope.project.logicalFrame.purposes.forEach(function(purpose) {
				$scope.rows.push({type: 'header', text: purpose.description, indent: 1});
				Array.prototype.push.apply($scope.rows, purpose.indicators.map(getStats.bind(null, 1)));
				purpose.outputs.forEach(function(output) {
					$scope.rows.push({type: 'header', text: output.description, indent: 2});
					Array.prototype.push.apply($scope.rows, output.indicators.map(getStats.bind(null, 2)));
				});
			});

			Array.prototype.push.apply($scope.rows, $scope.getUnassignedIndicators().map(getStats.bind(null, 0)));
		});


		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// // This hash allow opening and closing raw datas.
		// $scope.open = {};

		// // those 2 hashes represent what the user sees.
		// $scope.presentation = {plot: false, display: $state.current.data.display || 'value' };
		// $scope.query = {
		// 	project: $scope.project,
		// 	begin:   mtReporting.getDefaultStartDate($scope.project),
		// 	end:     mtReporting.getDefaultEndDate($scope.project),
		// 	groupBy: 'month', type: 'project', id: ''
		// };

		// // Update loaded inputs when query.begin or query.end changes.
		// var inputsPromise = null;
		// $scope.$watch('query', function(newQuery, oldQuery) {
		// 	// if anything besides groupBy changes, we need to refetch.
		// 	// FIXME: we could widely optimize this.
		// 	if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end || oldQuery.id !== newQuery.id)
		// 		inputsPromise = Input.fetchFromQuery(newQuery);

		// 	// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
		// 	inputsPromise.then(function(inputs) {
		// 		$scope.stats = mtReporting.computeProjectReporting(inputs, newQuery, indicatorsById);
		// 	});
		// }, true)
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
