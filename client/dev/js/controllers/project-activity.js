"use strict";

angular
	.module(
		'monitool.controllers.project.activity',
		[
			"monitool.services.statistics.olap"
		]
	)

	.controller('ProjectCollectionFormListController', function() {

	})

	.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, $modal, formUsage, form, uuid) {
		$scope.master = angular.copy(form);
		$scope.form = angular.copy(form); // FIXME one of those copies looks useless.
		$scope.formUsage = formUsage;
		$scope.formIndex = $scope.project.forms.findIndex(function(f) { return f.id === form.id; });

		$scope.delete = function() {
			// Fetch this forms inputs.
			var easy_question = $filter('translate')('project.delete_form_easy'),
				hard_question = $filter('translate')('project.delete_form_hard', {num_inputs: formUsage.length}),
				answer = $filter('translate')('project.delete_form_hard_answer', {num_inputs: formUsage.length});

			var really = (formUsage.length == 0 && window.confirm(easy_question))
				|| (formUsage.length && window.prompt(hard_question) == answer);

			// If there are none, just confirm that the user wants to do this for real.
			if (really) {
				$scope.project.forms.splice($scope.formIndex, 1);
				$scope.formIndex = -1;
				$scope.$parent.save().then(function() {
					$state.go('main.project.collection_form_list');
				});
			}
		};

		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// if unsaved changes were made
			if (!angular.equals($scope.master, $scope.form)) {
				// then ask the user if he meant it
				if (!window.confirm($filter('translate')('shared.sure_to_leave')))
					event.preventDefault();
			}
		});

		$scope.$watch('form.collect', function(collect) {
			if (collect === 'some_entity' && !$scope.form.entities)
				$scope.form.entities = [];
			else if (collect !== 'some_entity' && $scope.form.entities)
				delete $scope.form.entities;
		});

		// Form is invalid if we don't have at least one element.
		$scope.$watch('form.elements.length', function(length) {
			$scope.dataSourceForm.$setValidity('elementsLength', length >= 1);
		});

		$scope.moreOptions = function(element, initialPartition) {
			var promise = $modal.open({
				controller: 'PartitionEditionModalController',
				templateUrl: 'partials/projects/activity/partition-modal.html',
				size: 'lg',
				resolve: { initialPartition: function() { return initialPartition; } }
			}).result;

			promise.then(function(partition) {
				if (initialPartition && !partition)
					element.partitions.splice(element.partitions.indexOf(initialPartition), 1);
				else if (initialPartition && partition)
					element.partitions[element.partitions.indexOf(initialPartition)] = partition;
				else if (!initialPartition && partition)
					element.partitions.push(partition);
			});
		};

		$scope.newVariable = function() {
			$scope.form.elements.push({id: uuid.v4(), name: "", partitions: [], geoAgg: 'sum', timeAgg: 'sum'});
		};

		$scope.upElement = function(index) {
			var element = $scope.form.elements[index];
			$scope.form.elements.splice(index, 1);
			$scope.form.elements.splice(index - 1, 0, element);
		};

		$scope.downElement = function(index) {
			var element = $scope.form.elements[index];
			$scope.form.elements.splice(index, 1);
			$scope.form.elements.splice(index + 1, 0, element);
		};

		$scope.remove = function(item, target) {
			var index = target.findIndex(function(arrItem) { return item.id === arrItem.id; });
			if (index !== -1)
				target.splice(index, 1)
		};

		$scope.save = function() {
			// replace or add the form in the project.
			if ($scope.formIndex === -1) {
				$scope.formIndex = $scope.project.forms.length
				$scope.project.forms.push(angular.copy($scope.form));
			}
			else
				$scope.project.forms[$scope.formIndex] = angular.copy($scope.form);

			// call ProjectMenuController save method.
			return $scope.$parent.save().then(function() {
				$scope.master = angular.copy($scope.form);

				if ($stateParams.formId === 'new')
					$state.go('main.project.collection_form_edition', {formId: form.id});
			});
		};

		$scope.isUnchanged = function() {
			// console.log('main isUnchanged', $scope.master, $scope.form)
			return angular.equals($scope.master, $scope.form);
		};

		$scope.reset = function() {
			$scope.form = angular.copy($scope.master);
		};
	})

	.controller('PartitionEditionModalController', function($scope, $modalInstance, initialPartition, uuid) {
		if (!initialPartition)
			initialPartition = {
				id: uuid.v4(),
				name: "",
				elements: [{id: uuid.v4(), name: ""}, {id: uuid.v4(), name: ""}],
				groups: [],
				aggregation: "sum"
			}

		$scope.master = initialPartition;
		$scope.partition = angular.copy(initialPartition);

		$scope.$watch('partition.elements.length', function(length) {
			$scope.partitionForm.$setValidity('elementLength', length >= 2);
		});

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.partition);
		};

		$scope.save = function() {
			$modalInstance.close($scope.partition);
		};

		$scope.reset = function() {
			$scope.partition = angular.copy($scope.master);
		};

		$scope.createGroup = function() {
			$scope.partition.groups.push({id: uuid.v4(), name: '', members: []});
		};

		$scope.createPartitionElement = function() {
			$scope.partition.elements.push({id: uuid.v4(), name: ''});
		};

		$scope.deletePartitionElement = function(partitionElementId) {
			$scope.partition.elements = $scope.partition.elements.filter(function(element) {
				return element.id !== partitionElementId;
			});
		};

		$scope.deleteGroup = function(partitionGroupId) {
			$scope.partition.groups = $scope.partition.groups.filter(function(group) {
				return group.id !== partitionGroupId;
			});
		};

		$scope.up = function(index, list) {
			var element = array.splice(index, 1);
			array.splice(index - 1, 0, element[0]);
		};

		$scope.down = function(index, list) {
			var element = array.splice(index, 1);
			array.splice(index + 1, 0, element[0]);
		};
	})

	.controller('ProjectCollectionInputListController', function($scope, $state, project, inputsStatus, Input) {
		$scope.selectedForm = project.forms[0];
		$scope.inputsStatus = inputsStatus;

		// pass information needed for creating new inputs on free forms.
		$scope.newInputDate = {date: new Date()};
		$scope.addInput = function(entityId) {
			$state.go(
				'main.project.collection_input_edition',
				{
					period: moment($scope.newInputDate.date).format('YYYY-MM-DD'),
					formId: $scope.selectedForm.id,
					entityId: entityId
				}
			);
		};

		// Write hash with metadata on columns to know if we need to display them.
		$scope.displayInfo = {};
		project.forms.forEach(function(form) {
			$scope.displayInfo[form.id] = {};
			$scope.displayInfo[form.id]._ = { displayFooterRow: false, numCols: 1 };

			['none'].concat(project.entities.pluck('id')).forEach(function(columnId) {
				//////////////////////
				// List data that we need to decide if we will display this column and how.
				//////////////////////
				var hasExpectedInputs, hasPreviousInputs, isRelevantToForm, isAllowed;

				// Check inputsStatus to know if we had previous or expected inputs.
				hasExpectedInputs = hasPreviousInputs = false;
				for (var strDate in inputsStatus[form.id]) {
					var inputStatus = inputsStatus[form.id][strDate][columnId];
					if (inputStatus == 'done' || inputStatus == 'outofschedule')
						hasPreviousInputs = true;

					if (inputStatus == 'expected')
						hasExpectedInputs = true;
				}

				// Check form definition to know which columns are relevant.
				if (form.collect == 'project')
					isRelevantToForm = columnId === 'none';
				else if (form.collect == 'some_entity')
					isRelevantToForm = columnId !== 'none' && form.entities.indexOf(columnId) !== -1;
				else if (form.collect == 'entity')
					isRelevantToForm = columnId !== 'none';
				else
					throw new Error('Invalid form.collect');

				// Check user permissions to know which columns can be modified.
				isAllowed = project.canEditInputsOnEntity(columnId);

				//////////////////////
				// Decide what to display
				//////////////////////

				// Remove the expected inputs for people that cannot edit.
				if (!isAllowed) {
					for (var strDate in inputsStatus[form.id]) {
						if (inputsStatus[form.id] &&
							inputsStatus[form.id][strDate] &&
							inputsStatus[form.id][strDate][columnId] === 'expected')
							delete inputsStatus[form.id][strDate][columnId];

						if (angular.equals(inputsStatus[form.id][strDate], {}))
							delete inputsStatus[form.id][strDate];
					}

				}
				if (angular.equals(inputsStatus[form.id], {}))
					delete inputsStatus[form.id];

				// Create entry in columns by form.
				$scope.displayInfo[form.id][columnId] = {
					displayColumn: hasPreviousInputs || isRelevantToForm,
					canEdit: isAllowed && isRelevantToForm,
					displayAddButton: form.periodicity == 'free' && isAllowed && isRelevantToForm
				};

				if ($scope.displayInfo[form.id][columnId].displayColumn)
					$scope.displayInfo[form.id]._.numCols++;

				if ($scope.displayInfo[form.id][columnId].displayAddButton)
					$scope.displayInfo[form.id]._.displayFooterRow = true;
			});
		});
	})

	.controller('ProjectCollectionInputEditionController', function($scope, $state, $filter, form, inputs) {
		$scope.form          = form;
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.lastInput     = inputs.previous;
		$scope.master        = angular.copy($scope.currentInput)
		$scope.inputEntity   = $scope.project.entities.find(function(entity) { return entity.id == $scope.currentInput.entity; });

		// Can user edit this input?
		$scope.canEdit = $scope.project.canEditInputsOnEntity($scope.currentInput.entity);

		// Handle rotations.
		$scope.rotations  = {};
		$scope.positions  = {};

		$scope.move = function(offset, element) {
			var numPositions = element.partitions.length - 1;
			$scope.positions[element.id]
				= window.localStorage['input.position.' + element.id]
				= ((($scope.positions[element.id] + offset) % numPositions) + numPositions) % numPositions;

			if (typeof $scope.positions[element.id] != "number" || !isFinite($scope.positions[element.id]))
				$scope.positions[element.id] = 0;
		};

		$scope.rotate = function(offset, element) {
			var numPermutations = Math.factorial(element.partitions.length);
			$scope.rotations[element.id]
				= window.localStorage['input.rotation.' + element.id]
				= ((($scope.rotations[element.id] + offset) % numPermutations) + numPermutations) % numPermutations;

			if (typeof $scope.rotations[element.id] != "number" || !isFinite($scope.rotations[element.id]))
				$scope.rotations[element.id] = 0;
		};

		form.elements.forEach(function(element) {
			$scope.rotations[element.id] = (window.localStorage['input.rotation.' + element.id] % Math.factorial(element.partitions.length)) || 0
			if (window.localStorage['input.position.' + element.id] != undefined)
				$scope.positions[element.id] = window.localStorage['input.position.' + element.id] % (element.partitions.length - 1);
			else
				$scope.positions[element.id] = Math.floor(element.partitions.length / 2)

			$scope.rotate(0, element);
			$scope.move(0, element);
		});

		$scope.save = function() {
			pageChangeWatch()
			$scope.currentInput.$save(function() { $state.go('main.project.collection_input_list'); });
		};

		$scope.reset = function() {
			$scope.currentInput = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.currentInput);
		};

		$scope.delete = function() {
			var easy_question = $filter('translate')('project.delete_form_easy');

			if (window.confirm(easy_question)) {
				pageChangeWatch(); // remove the change page watch, because it will trigger otherwise.
				$scope.currentInput.$delete(function() {
					$state.go('main.project.collection_input_list');
				});
			}
		};

		var pageChangeWatch = $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			// if unsaved changes were made
			if (!angular.equals($scope.master, $scope.currentInput)) {
				// then ask the user if he meant it
				if (!window.confirm($filter('translate')('shared.sure_to_leave')))
					event.preventDefault();
			}
		});
	})

	.controller('ProjectActivityReportingController', function($scope, Olap, inputs, mtReporting) {
		// Create default filter so that all inputs are used.
		$scope.filters = {_location: "none", _start: new Date('9999-01-01'), _end: new Date('0000-01-01')};
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

		$scope.splits = {};
		$scope.onSplitClick = function(rowId, partitionId) {
			if ($scope.splits[rowId] !== partitionId)
				$scope.splits[rowId] = partitionId;
			else
				delete $scope.splits[rowId];
		};

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// when input list change, or regrouping is needed, compute table rows again.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.$watch('[filters, groupBy, splits]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters._start, $scope.filters._end, $scope.filters._location, $scope.project)
			$scope.rows = mtReporting.computeActivityReporting(cubes, $scope.project, $scope.groupBy, $scope.filters, $scope.splits);
		}, true);
	})


	.controller('ProjectActivityDetailedReportingController', function($scope, $filter, Olap, inputs, mtReporting) {
		$scope.plots = {};

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Compute cubes for all elements, from all inputs.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// Create a hash that lists form elements by id. It will be used by: 
		var elementsById = {};
		$scope.project.forms.forEach(function(form) { 
			form.elements.forEach(function(element) {
				elementsById[element.id] = element;
			});
		});

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = [];
		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.elementOptions.push({id: element.id, name: element.name, group: form.name, element: element});
			});
		});
		$scope.wrap = {chosenElementId: $scope.elementOptions[0].id};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('wrap.chosenElementId', function(elementId) {
			var cube = cubes[elementId], element = elementsById[elementId];

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var filters;
			if (cube.data.length != 0) {
				// retrieve first and last date.
				var dimension   = cube._getDimension('day'),
					startString = dimension.items[0],
					endString   = dimension.items[dimension.items.length - 1],
					startDate   = new Date(startString.substring(0, 4) * 1, startString.substring(5, 7) - 1, startString.substring(8, 10) * 1),
					endDate     = new Date(endString.substring(0, 4) * 1, endString.substring(5, 7) - 1, endString.substring(8, 10) * 1);

				// copy filled filters as default value.
				filters = {_start: startDate, _end: endDate};
			}
			else
				filters = {_start: new Date('9999-01-01'), _end: new Date('0000-01-01')};
			
			cube.dimensions.forEach(function(dimension) {
				if (dimension.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/))
					filters[dimension.id] = dimension.items.slice();
			});

			// default group by
			var groupBy;
			if (mtReporting.getColumns('month', filters._start, filters._end).length < 15)
				groupBy = 'month';
			else if (mtReporting.getColumns('quarter', filters._start, filters._end).length < 15)
				groupBy = 'quarter';
			else
				groupBy = 'year';

			// make default query.
			$scope.query = { elementId: elementId, filters: filters, groupBy: groupBy };

			////////////////////////////////////////
			// Create needed info to display controls on screen
			////////////////////////////////////////

			$scope.dimensions = element.partitions;
		});

		////////////////////////////////////////////////////
		// The query object contains everything that is needed to compute the final table.
		// When it changes, we need to update the results.
		////////////////////////////////////////////////////
		
		$scope.$watch('query', function(query) {
			var element = elementsById[query.elementId];

			$scope.cols = mtReporting.getColumns($scope.query.groupBy, $scope.query.filters._start, $scope.query.filters._end);
			$scope.rows = mtReporting.computeDetailedActivityReporting(cubes, $scope.project, element, $scope.query.groupBy, $scope.query.filters);
		}, true);
	})

	.controller('ProjectActivityOlapController', function($scope, $filter, Olap, mtReporting, inputs) {

		////////////////////////////////////////////////////
		// Initialization code.
		////////////////////////////////////////////////////

		// Compute cubes for all elements, from all inputs.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// Create a hash that lists form elements by id. It will be used by: 
		var elementsById = {};
		$scope.project.forms.forEach(function(form) { 
			form.elements.forEach(function(element) {
				elementsById[element.id] = element;
			});
		});

		// Create array with ngOptions for the list of variables, and init select value.
		$scope.elementOptions = [];
		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.elementOptions.push({id: element.id, name: element.name, group: form.name, element: element});
			});
		});
		$scope.wrap = {chosenElementId: $scope.elementOptions[0].id};

		// init objects that we will need to render query controls in the ux.
		$scope.query = {elementId: null, colDimensions: null, rowDimensions: null, filters: null};

		////////////////////////////////////////////////////
		// Each time the element is changed, initialize the query object.
		////////////////////////////////////////////////////

		$scope.$watch('wrap.chosenElementId', function(elementId) {
			var cube = cubes[elementId], element = elementsById[elementId];

			////////////////////////////////////////
			// Create default query for this elementId
			////////////////////////////////////////

			var filters;
			if (cube.data.length != 0) {
				// retrieve first and last date.
				var dimension   = cube._getDimension('day'),
					startString = dimension.items[0],
					endString   = dimension.items[dimension.items.length - 1],
					startDate   = new Date(startString.substring(0, 4) * 1, startString.substring(5, 7) - 1, startString.substring(8, 10) * 1),
					endDate     = new Date(endString.substring(0, 4) * 1, endString.substring(5, 7) - 1, endString.substring(8, 10) * 1);

				// copy filled filters as default value.
				filters = {_start: startDate, _end: endDate};
			}
			else
				filters = {_start: new Date('9999-01-01'), _end: new Date('0000-01-01')};
			
			// Init all filters as full
			cube.dimensions.forEach(function(dimension) {
				if (dimension.id !== 'day')
					filters[dimension.id] = dimension.items;
			});

			// make default query.
			$scope.query = { elementId: elementId, colDimensions: [], rowDimensions: ['month'], filters: filters };

			////////////////////////////////////////
			// Create needed info to display controls on screen
			////////////////////////////////////////

			$scope.dimensions = [];

			// Add entity dimension
			if (cube._getDimension('entity'))
				$scope.dimensions.push(
					{id: "entity", name: 'project.dimensions.entity', elements: $scope.project.entities, groups: $scope.project.groups}
				);

			// Add partitions
			$scope.dimensions = $scope.dimensions.concat(element.partitions);

			// Add time dimensions
			$scope.dimensions.push(
				{id: "day",     name: 'project.dimensions.day',     elements: cube._getDimension('day').items.map(function(i) { return {id: i, name: i}; }),          groups: []},
				{id: "week",    name: 'project.dimensions.week',    elements: cube._getDimensionGroup('week').items.map(function(i) { return {id: i, name: i}; }),    groups: []},
				{id: "month",   name: 'project.dimensions.month',   elements: cube._getDimensionGroup('month').items.map(function(i) { return {id: i, name: i}; }),   groups: []},
				{id: "quarter", name: 'project.dimensions.quarter', elements: cube._getDimensionGroup('quarter').items.map(function(i) { return {id: i, name: i}; }), groups: []},
				{id: "year",    name: 'project.dimensions.year',    elements: cube._getDimensionGroup('year').items.map(function(i) { return {id: i, name: i}; }),    groups: []}
			);
		});

		////////////////////////////////////////////////////
		// Each time the element is changed or a new dimension is chosen to split on, recreate allowed splits.
		////////////////////////////////////////////////////

		$scope.$watch('[dimensions, query.colDimensions, query.rowDimensions]', function() {
			// update available rows and cols
			var timeFields = ['year', 'quarter', 'month', 'week', 'day'],
				timeUsedOnCols = timeFields.find(function(tf) { return $scope.query.colDimensions.indexOf(tf) !== -1; }),
				timeUsedOnRows = timeFields.find(function(tf) { return $scope.query.rowDimensions.indexOf(tf) !== -1; });

			$scope.availableCols = $scope.dimensions.filter(function(dimension) {
				if (timeFields.indexOf(dimension.id) !== -1)
					return timeUsedOnCols == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return $scope.query.rowDimensions.indexOf(dimension.id) == -1;
			});

			$scope.availableRows = $scope.dimensions.filter(function(dimension) {
				if (timeFields.indexOf(dimension.id) !== -1)
					return timeUsedOnRows == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return $scope.query.colDimensions.indexOf(dimension.id) == -1;
			});
		}, true);

		////////////////////////////////////////////////////
		// The query object contains everything that is needed to compute the final table.
		// When it changes, we need to update the results.
		////////////////////////////////////////////////////
		
		$scope.$watch('query', function(query) {

			////////////////////////////////////////
			// Query cube & postprocess for display
			////////////////////////////////////////

			var cube = cubes[query.elementId],
				cubeDimensions = $scope.query.colDimensions.concat($scope.query.rowDimensions),
				cubeFilters = mtReporting.createCubeFilter(cube, $scope.query.filters);

			var makeRowCol = function(selectedDimId) {
				var dimension = $scope.dimensions.find(function(dim) { return dim.id == selectedDimId; });

				var rowcolInfo = [];
				Array.prototype.push.apply(rowcolInfo, dimension.groups);
				Array.prototype.push.apply(rowcolInfo, dimension.elements);
				rowcolInfo.push({id: '_total', name: "Total", members: true}); // members:true, so that group icon is displayed
				return rowcolInfo;
			};

			$scope.display = {
				data: cube.flatQuery(cubeDimensions, cubeFilters),
				cols: query.colDimensions.map(makeRowCol),
				rows: query.rowDimensions.map(makeRowCol)
			};

			// work around grid bug...
			if ($scope.display.rows.length === 0) {
				$scope.display.rows = $scope.display.cols;
				$scope.display.cols = [];
			}

		}, true);
	});
