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
		$scope.editIndicator = function(planning, parent) {
			var promise = $modal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/indicators/edition-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {planning: function() { return planning; }}
			}).result;

			promise.then(function(newPlanning) {
				if (planning && !newPlanning)
					parent.splice(parent.indexOf(planning), 1);
				else if (!planning && newPlanning)
					parent.push(newPlanning);
				else if (planning && newPlanning)
					parent.splice(parent.indexOf(planning), 1, newPlanning);
			});
		};
	})

	.controller('ProjectIndicatorEditionModalController', function($scope, $modalInstance, itertools, planning) {
		// Build possible variables and filters.
		$scope.elements = []
		$scope.filters = {};
		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.elements.push({id: element.id, name: element.name, group: form.name});
				$scope.filters[element.id] = [{group: null, name: "Tous", filter: {}}];
				element.partitions.forEach(function(partition, index) {
					partition.forEach(function(partitionElement) {
						var filter = {};
						filter['partition' + index] = [partitionElement.id];
						$scope.filters[element.id].push({
							group: "Partition " + index,
							name: "Uniquement " + partitionElement.name,
							filter: filter
						});
					});
				});
			});
		});

		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.planning = planning ? angular.copy(planning) : {
			display: '',
			indicatorId: null,
			colorize: true,
			baseline: null,
			target: null,
			formula: "default",
			parameters: {'default': {elementId: null, filter: null}}
		};
		$scope.isNew = !planning;

		// List all parameters
		var parameters = {};
		for (var key in $scope.planning.parameters)
			parameters[key] = $scope.planning.parameters[key];

		$scope.$watch('planning.formula', function(formula) {
			var newSymbols, oldSymbols = Object.keys($scope.planning.parameters).sort();
			try { newSymbols = Parser.parse($scope.planning.formula).variables().sort(); }
			catch (e) { newSymbols = []; }

			if (!angular.equals(newSymbols, oldSymbols)) {
				// Remove old symbols from formula
				oldSymbols.filter(function(s) { return newSymbols.indexOf(s) === -1; }).forEach(function(s) {
					parameters[s] = $scope.planning.parameters[s];
					delete $scope.planning.parameters[s];
				});

				// Add new symbols to formula
				newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; }).forEach(function(s) {
					$scope.planning.parameters[s] = parameters[s] || {elementId: null, filter: []};
				});
			}
		});

		// that's a bit overkill
		$scope.$watch('planning.parameters', function() {
			for (var key in $scope.planning.parameters) {
				if ($scope.planning.parameters[key].elementId) {
					var allowedFilters = $scope.filters[$scope.planning.parameters[key].elementId],
						setFilter      = $scope.planning.parameters[key].filter;

					if (!allowedFilters.find(function(f) { return f.filter == setFilter; })) {
						$scope.planning.parameters[key].filter = allowedFilters[0].filter;
						continue;
					}
				}
			}
		}, true);

		$scope.save   = function() { $modalInstance.close($scope.planning); };
		$scope.delete = function() { $modalInstance.close(null); };
		$scope.cancel = function() { $modalInstance.dismiss(); };
	})

	.controller('ProjectReportingController', function($scope, Olap, inputs, mtReporting) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

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

		// default group by
		if (mtReporting.getColumns('month', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// when input list change, or regrouping is needed, compute table rows again.
		$scope.$watchGroup(['filters.begin', 'filters.end', 'filters.entityId', 'groupBy'], function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end, $scope.filters.entityId, $scope.project);
			$scope.rows = mtReporting.computeReporting(cubes, $scope.project, $scope.project.logicalFrame, $scope.groupBy, $scope.filters);
		});
	})

	.controller('ProjectDetailedReportingController', function($scope, $filter, Olap, inputs, mtReporting) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

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

		// default group by
		if (mtReporting.getColumns('month', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters.begin, $scope.filters.end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		// Create list of indicators to choose from, and set default value.
		$scope.indicators = [];
		Array.prototype.push.apply($scope.indicators, $scope.project.logicalFrame.indicators);
		$scope.project.logicalFrame.purposes.forEach(function(purpose) {
			Array.prototype.push.apply($scope.indicators, purpose.indicators);
			purpose.outputs.forEach(function(output) {
				Array.prototype.push.apply($scope.indicators, purpose.indicators);
			}, this);
		}, this);

		$scope.indicator  = $scope.indicators[0];
		$scope.indicators = $scope.indicators.map(function(indicator) {
			return {indicator: indicator, group: "Logical Frame"}
		});

		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.$watchGroup(['indicator', 'filters', 'groupBy'], function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end)
			$scope.rows = mtReporting.computeDetailedReporting(cubes, $scope.project, $scope.indicator, $scope.groupBy, $scope.filters);
		}, true);



		// $scope.indicatorId = Object.keys($scope.project.indicators)[0];
		// When filter changes (or init), build the list of inputs to pass to the scope.
		// $scope.$watch('filters', function() {
		// 	// ...rebuild usedInputs
		// 	$scope.inputs = inputs.filter(function(input) {
		// 		return input.period >= $scope.filters.begin && input.period <= $scope.filters.end;
		// 	});
		// }, true);

		// var makeRow = function(rowId, rowName, cols, reporting, indicator, indicatorMeta, indent) {
		// 	return {
		// 		id: rowId, type:'data', indent: indent || 0, name: rowName,
		// 		unit: indicator.unit,
		// 		colorize: indicatorMeta.colorize,
		// 		baseline: indicatorMeta.baseline,
		// 		target: indicatorMeta.target,
		// 		cols: cols.map(function(col) {
		// 			try { return reporting[rowId][col.id][indicator._id]; }
		// 			catch (e) { return null; }
		// 		})
		// 	};
		// };

		// when input list change, or regrouping is needed, compute table rows again.
		// $scope.$watchGroup(['inputs', 'groupBy', 'indicatorId'], function() {
		// 	var indicator = $scope.indicatorsById[$scope.indicatorId],
		// 		indicatorMeta = $scope.project.indicators[$scope.indicatorId],
		// 		reporting = mtReporting.computeProjectDetailedReporting($scope.inputs, $scope.project, $scope.groupBy, $scope.indicatorsById);

		// 	$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end);
		// 	$scope.rows = [
		// 		makeRow($scope.project._id, $filter('translate')('project.full_project'), $scope.cols, reporting, indicator, indicatorMeta, 0),
		// 		{ id: makeUUID(), type: "header", text: $filter('translate')('project.collection_site_list'), indent: 0 }
		// 	];

		// 	Array.prototype.push.apply($scope.rows, $scope.project.entities.map(function(entity) {
		// 		return makeRow(entity.id, entity.name, $scope.cols, reporting, indicator, indicatorMeta, 1);
		// 	}));

		// 	$scope.rows.push({ id: makeUUID(), type: "header", text: $filter('translate')('project.groups'), indent: 0 });
		// 	Array.prototype.push.apply($scope.rows, $scope.project.groups.map(function(group) {
		// 		return makeRow(group.id, group.name, $scope.cols, reporting, indicator, indicatorMeta, 1);
		// 	}));
		// });
	})

	// .controller('ProjectReportingAnalysisListController', function($scope, reports) {
	// 	$scope.reports = reports;
	// })

	// .controller('ProjectReportingAnalysisController', function($scope, $state, $stateParams, $modal, report, project, indicatorsById) {
	// 	$scope.report = report;
	// 	$scope.master = angular.copy(report);
		
	// 	$scope.addReportGrid = function(index) {
	// 		$modal.open({
	// 			controller: 'ProjectReportingAnalysisDataSelectionController',
	// 			templateUrl: 'partials/projects/reporting/analysis-select-data.html',
	// 			size: 'lg', scope: $scope, resolve: { indicatorsById: function() { return indicatorsById; } }
	// 		}).result.then(function(result) {
	// 			result.type = 'data';
	// 			$scope.report.elements.splice(index, 0, result);
	// 		});
	// 	};

	// 	$scope.addReportText = function(index) {
	// 		$scope.report.elements.splice(index, 0, {
	// 			type: "text",
	// 			content: ""
	// 		});
	// 	};

	// 	$scope.move = function(index, delta) {
	// 		var elements = $scope.report.elements.splice(index, 1);
	// 		$scope.report.elements.splice(index + delta, 0, elements[0]);
	// 	};

	// 	$scope.remove = function(index) {
	// 		$scope.report.elements.splice(index, 1);
	// 	};

	// 	$scope.save = function() {
	// 		if ($stateParams.reportId === 'new')
	// 			$scope.report._id = makeUUID();

	// 		$scope.report.$save().then(function() {
	// 			$scope.master = angular.copy($scope.report);
				
	// 			if ($stateParams.reportId === 'new')
	// 				$state.go('main.project.reporting_analysis', {reportId: $scope.report._id});
	// 		}).catch(function(error) {
	// 			$scope.error = error;
	// 		});
	// 	};

	// 	$scope.reset = function() {
	// 		$scope.report = angular.copy($scope.master);
	// 	};

	// 	$scope.isUnchanged = function() {
	// 		return angular.equals($scope.report, $scope.master);
	// 	}
	// })

	// // FIXME this needs a rewriting. The code is way too kludgy
	// .controller('ProjectReportingAnalysisDataSelectionController', function($scope, $modalInstance, mtReporting, indicatorsById) {
	// 	$scope.query = {
	// 		project: $scope.project,
	// 		begin:   mtReporting.getDefaultStartDate($scope.project),
	// 		end:     mtReporting.getDefaultEndDate($scope.project),
	// 		groupBy: 'month', type: 'project', id: ''
	// 	};
	// 	$scope.availableIndicators = Object.keys($scope.project.indicators).map(function(i) { return indicatorsById[i]; });
	// 	$scope.container = {chosenIndicatorIds: []};

	// 	var stats = {cols: [], rows: []};
	// 	$scope.result = {display: "both"};

	// 	var update = function() {
	// 		$scope.result.stats = angular.copy(stats);
	// 		$scope.result.stats.rows = $scope.result.stats.rows.filter(function(row) {
	// 			return $scope.container.chosenIndicatorIds.indexOf(row.id) !== -1;
	// 		});
	// 		$scope.result.query = {
	// 			begin: $scope.query.begin,
	// 			end: $scope.query.end,
	// 			groupBy: $scope.query.groupBy,
	// 			type: $scope.query.type,
	// 			id: $scope.query.id
	// 		};
	// 	};

	// 	// Update loaded inputs when query.begin or query.end changes.
	// 	var inputsPromise = null;
	// 	$scope.$watch('query', function(newQuery, oldQuery) {
	// 		// if anything besides groupBy changes, we need to refetch.
	// 		// FIXME: we could widely optimize this.
	// 		if (!inputsPromise || oldQuery.begin !== newQuery.begin || oldQuery.end !== newQuery.end || oldQuery.id !== newQuery.id)
	// 			inputsPromise = mtReporting.getPreprocessedInputs(newQuery);

	// 		// Once input are ready (which will be immediate if we did not reload them) => refresh the scope
	// 		inputsPromise.then(function(inputs) {
	// 			stats = mtReporting.getProjectReporting(inputs, newQuery, indicatorsById);
	// 			update();
	// 		});
	// 	}, true)

	// 	$scope.$watch('container.chosenIndicatorIds', update, true)

	// 	$scope.choose = function(indicatorId) {
	// 		$modalInstance.close($scope.result);
	// 	};

	// 	$scope.cancel = function() {
	// 		$modalInstance.dismiss()
	// 	};
	// })
