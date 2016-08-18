"use strict";

angular
	.module(
		'monitool.controllers.project.indicators',
		[
			'monitool.services.statistics.parser',
		]
	)

	.controller('ProjectLogicalFrameController', function($scope, $q, $uibModal) {

		/////////////////////
		// Allow purposes, outputs and indicators reordering. We need to hack around bugs
		// in current Sortable plugin implementation.
		// @see https://github.com/RubaXa/Sortable/issues/581
		// @see https://github.com/RubaXa/Sortable/issues/722
		/////////////////////

		$scope.logframeSortOptions = {handle: '.logframe-handle'};
		$scope.purposeSortOptions = {group:'purposes', handle: '.purpose-handle'};
		$scope.outputSortOptions = {group:'outputs', handle: '.output-handle'};
		$scope.indicatorsSortOptions = {
			group:'indicators', 
			handle: '.indicator-handle',
			onStart: function() { document.body.classList.add('dragging'); },
			onEnd: function() { document.body.classList.remove('dragging'); }
		};

		$scope.onSortableMouseEvent = function(group, enter) {
			if (group == 'outputs')
				$scope.purposeSortOptions.disabled = enter;
			else if (group == 'indicators')
				$scope.purposeSortOptions.disabled = $scope.outputSortOptions.disabled = enter;
		}

		/////////////////////
		// Pass the form to the shared controller over it, to be able
		// to enable and disable the save button.
		/////////////////////
		
		var unwatch = $scope.$watch('projectForm', function(projectForm) {
			if (projectForm) {
				$scope.formContainer.currentForm = projectForm;
				unwatch();
			}
		});
		
		/////////////////////
		// To make the page faster, we only put one logical frame in the scope
		// and change when the tabs on top are used.
		/////////////////////

		$scope.logicalFrameIndex = $scope.project.logicalFrames.length ? 0 : null;
		
		$scope.setLogicalFrame = function(index) {
			$scope.logicalFrameIndex = index;
		};

		$scope.createLogicalFrame = function() {
			$scope.project.logicalFrames.push({
				name: '',
				goal: '',
				indicators: [],
				purposes: []
			});
			$scope.logicalFrameIndex = $scope.project.logicalFrames.length - 1;
		};

		$scope.deleteLogicalFrame = function() {
			$scope.project.logicalFrames.splice($scope.logicalFrameIndex, 1);
			$scope.logicalFrameIndex = $scope.project.logicalFrames.length ? 0 : null;
		};

		/////////////////////
		// Create and remove elements from logical frame
		/////////////////////
		
		$scope.addPurpose = function() {
			$scope.project.logicalFrames[$scope.logicalFrameIndex].purposes.push({
				description: "", assumptions: "", indicators: [], outputs: []});
		};

		$scope.addOutput = function(purpose) {
			purpose.outputs.push({
				description: "", assumptions: "", indicators: [], activities: []});
		};

		$scope.addActivity = function(output) {
			output.activities.push({description: ""});
		};

		$scope.remove = function(element, list) {
			list.splice(list.indexOf(element), 1);
		};

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(planning, parent) {
			var promise = $uibModal.open({
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

		// Watch reset button
		$scope.$watch('project', function() {
			if ($scope.project.logicalFrames.length == 0)
				$scope.logicalFrameIndex = null;

			else if (
				($scope.logicalFrameIndex >= $scope.project.logicalFrames.length) ||
				($scope.logicalFrameIndex == null && $scope.project.logicalFrames.length))
				$scope.logicalFrameIndex = 0;
		});

		$scope.link = function(planning) {
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorSelectionModalController',
				templateUrl: 'partials/projects/indicators/selection-modal.html',
				size: 'lg',
				scope: $scope,
				resolve: {
					hierarchy: function(Theme) { return Theme.query({mode: 'tree'}).$promise; }
				}
			}).result;

			promise.then(function(indicatorId) {
				planning.indicatorId = indicatorId;
			});
		};

		$scope.unlink = function(planning) {
			planning.indicatorId = null;
		};
	})

	.controller('ProjectIndicatorSelectionModalController', function($scope, $uibModalInstance, hierarchy) {
		// Compute indicators that we have in at least one logical frame.
		var projectIndicators = {};
		$scope.project.getLinkedIndicatorIds().forEach(function(indicatorId) { projectIndicators[indicatorId] = true; });

		// Compute indicators that are missing.
		$scope.missingIndicators = {};
		hierarchy.forEach(function(theme) {
			if ($scope.project.themes.indexOf(theme._id) !== -1)
				theme.children.forEach(function(type) {
					type.children.forEach(function(indicator) {
						if (!projectIndicators[indicator._id] && indicator.operation === 'mandatory')
							$scope.missingIndicators[indicator._id] = indicator;
					});
				});
		});
		$scope.missingIndicators = Object.keys($scope.missingIndicators).map(function(id) { return $scope.missingIndicators[id]; });

		$scope.hierarchy = hierarchy;
		$scope.searchField = '';

		$scope.choose = function(indicatorId) { $uibModalInstance.close(indicatorId); };
		$scope.cancel = function() { $uibModalInstance.dismiss() };
	})

	.controller('ProjectIndicatorEditionModalController', function($scope, $uibModalInstance, Parser, planning) {
		// Build possible variables and filters.
		$scope.selectElements = []
		$scope.elementsById = {};

		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.selectElements.push({id: element.id, name: element.name, group: form.name});
				$scope.elementsById[element.id] = element;
			});
		});

		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.planning = planning ? angular.copy(planning) : {
			display: '',
			indicatorId: null,
			colorize: true,
			baseline: null,
			target: null,
			unit: 'none',
			targetType: 'higher_is_better',
			formula: "default",
			parameters: {'default': {elementId: null, filter: {}}}
		};
		$scope.isNew = !planning;

		var formulaWatch = $scope.$watch('planning.formula', function(formula) {
			var newSymbols, oldSymbols = Object.keys($scope.planning.parameters).sort();
			try { newSymbols = Parser.parse($scope.planning.formula).variables().sort(); }
			catch (e) { newSymbols = []; }

			if (!angular.equals(newSymbols, oldSymbols)) {
				var removedSymbols = oldSymbols.filter(function(s) { return newSymbols.indexOf(s) === -1; }),
					addedSymbols   = newSymbols.filter(function(s) { return oldSymbols.indexOf(s) === -1; });

				// Remove old symbols from formula
				removedSymbols.forEach(function(s) { delete $scope.planning.parameters[s]; });

				// Add new symbols to formula
				addedSymbols.forEach(function(s) {
					$scope.planning.parameters[s] = {elementId: null, filter: {}};
				});
			}
		});

		// Watch planning.parameters to ensure that filters are valid.
		var paramWatch = $scope.$watch('planning.parameters', function() {
			for (var symbolName in $scope.planning.parameters) {
				var parameter = $scope.planning.parameters[symbolName];

				// Having a null elementId might always mean that filter is undefined...
				if (!parameter.elementId)
					parameter.filter = {};

				else {
					var partitions = $scope.elementsById[parameter.elementId].partitions,
						numPartitions = partitions.length;

					// Remove partitions in the filter that are not from this element
					for (var partitionId in parameter.filter)
						if (!partitions.find(function(e) { return e.id == partitionId; }))
							delete parameter.filter[partitionId];

					// Add missing partitions
					for (var i = 0; i < numPartitions; ++i)
						if (!parameter.filter[partitions[i].id])
							parameter.filter[partitions[i].id] = partitions[i].elements.pluck('id')
				}
			}
		}, true);

		$scope.save = function() {
			formulaWatch();
			paramWatch();

			for (var symbolName in $scope.planning.parameters) {
				var parameter = $scope.planning.parameters[symbolName],
					partitions = $scope.elementsById[parameter.elementId].partitions,
					numPartitions = partitions.length;

				for (var i = 0; i < numPartitions; ++i)
					// Remove filters that include all elements to make the project's JSON smaller
					// They will be restored when editing.
					if (parameter.filter[partitions[i].id].length == partitions[i].elements.length)
						delete parameter.filter[partitions[i].id];
			}

			$uibModalInstance.close($scope.planning);
		};
		
		$scope.delete = function() { $uibModalInstance.close(null); };
		$scope.cancel = function() { $uibModalInstance.dismiss(); };
	})

	.controller('ProjectReportingController', function($scope, Olap, inputs, mtReporting) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};
		$scope.currentLogframe = $scope.project.logicalFrames[0];
		$scope.setLogicalFrame = function(lf) { $scope.currentLogframe = lf; };

		// Create default filter so that all inputs are used.
		$scope.filters = {_location: "none", _start: new Date('9999-01-01T00:00:00Z'), _end: new Date('0000-01-01T00:00:00Z')};
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.filters._start)
				$scope.filters._start = inputs[i].period;
			if (inputs[i].period > $scope.filters._end)
				$scope.filters._end = inputs[i].period;
		}

		// default group by
		if (mtReporting.getColumns('month', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// when input list change, or regrouping is needed, compute table rows again.
		$scope.$watchGroup(['filters._start', 'filters._end', 'filters._location', 'groupBy', 'currentLogframe'], function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end, $scope.filters._location, $scope.project);
			$scope.rows = mtReporting.computeReporting(cubes, $scope.project, $scope.currentLogframe, $scope.groupBy, $scope.filters);
		});
	})

	.controller('ProjectDetailedReportingController', function($scope, $filter, Olap, inputs, mtReporting) {
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// Create default filter so that all inputs are used.
		$scope.filters = {_location: "none", _start: new Date('9999-01-01T00:00:00Z'), _end: new Date('0000-01-01T00:00:00Z')};
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.filters._start)
				$scope.filters._start = inputs[i].period;
			if (inputs[i].period > $scope.filters._end)
				$scope.filters._end = inputs[i].period;
		}

		// default group by
		if (mtReporting.getColumns('month', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'month';
		else if (mtReporting.getColumns('quarter', $scope.filters._start, $scope.filters._end).length < 15)
			$scope.groupBy = 'quarter';
		else
			$scope.groupBy = 'year';

		// Create list of indicators to choose from, and set default value.
		$scope.indicators = [];
		$scope.project.logicalFrames.forEach(function(logicalFrame) {
			var fn = function(i) { return {indicator: i, name: i.display, group: logicalFrame.name}; };
			Array.prototype.push.apply($scope.indicators, logicalFrame.indicators.map(fn));
			logicalFrame.purposes.forEach(function(purpose, purposeIndex) {
				Array.prototype.push.apply($scope.indicators, purpose.indicators.map(fn));
				purpose.outputs.forEach(function(output, outputIndex) {
					Array.prototype.push.apply($scope.indicators, output.indicators.map(fn));
				}, this);
			}, this);
		}, this);

		$scope.indicator = $scope.indicators[0].indicator;

		$scope.$watch('[indicator, filters, groupBy]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end)
			$scope.rows = mtReporting.computeDetailedReporting(cubes, $scope.project, $scope.indicator, $scope.groupBy, $scope.filters);
		}, true);
	});
