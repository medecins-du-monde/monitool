"use strict";

angular
	.module(
		'monitool.controllers.project.activity',
		[
			"monitool.services.olap",
			"ngSanitize"
		]
	)

	.controller('ProjectCollectionFormListController', function() {

	})

	.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, formUsage, form) {
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

		$scope.$watch('form.elements', function(elements) {
			$scope.maxPartitions = 0;
			elements.forEach(function(element) {
				$scope.maxPartitions = Math.max(element.partitions.length, $scope.maxPartitions);
			});
		}, true);

		$scope.newVariable = function() {
			$scope.form.elements.push({id: makeUUID(), name: "", partitions: [], geoAgg: 'sum', timeAgg: 'sum'});
		};

		$scope.newPartition = function(target) {
			target.push([]);
		};

		$scope.newPartitionElement = function(target) {
			target.push({id: makeUUID(), name: ""});
		};

		$scope.remPartition = function(partition, target) {
			target.splice(target.indexOf(partition), 1);
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
			return angular.equals($scope.master, $scope.form);
		};

		$scope.reset = function() {
			$scope.form = angular.copy($scope.master);
		};
	})

	.controller('ProjectCollectionInputListController', function($scope, project, inputsStatus, Input) {
		var projectUser = project.users.find(function(u) {
			return (
				($scope.userCtx.type == 'user' && u.id == $scope.userCtx._id) ||
				($scope.userCtx.type == 'partner' && u.username == $scope.userCtx.username)
			);
		});

		$scope.canEdit = {};
		[{id: 'none'}].concat(project.entities).forEach(function(entity) {
			if ($scope.userCtx.type == 'user' && $scope.userCtx.roles.indexOf('_admin') !== -1)
				$scope.canEdit[entity.id] = true;
			else if (!projectUser)
				$scope.canEdit[entity.id] = false;
			else {
				var role = projectUser.role;
				if (role == 'owner' || role == 'input_all')
					$scope.canEdit[entity.id] = true;
				else if (role == 'input')
					$scope.canEdit[entity.id] = projectUser.entities.indexOf(entity.id) != -1;
				else if (role == 'read')
					$scope.canEdit[entity.id] = false;
				else
					throw new Error('invalid role');
			}
		});

		$scope.selectedForm = project.forms[0];
		$scope.showFinished = !$scope.canEdit;

		// show/hide columns
		$scope.showProject = {};
		$scope.showEntities = {};
		$scope.numCols = {};
		for (var formId in inputsStatus) {
			$scope.showProject[formId] = false;
			$scope.showEntities[formId] = false;

			for (var strDate in inputsStatus[formId])
				for (var entityId in inputsStatus[formId][strDate]) {
					if (entityId == 'none')
						$scope.showProject[formId] = true;
					else
						$scope.showEntities[formId] = true;
				}

			$scope.numCols[formId] = 1 + ($scope.showEntities[formId] ? project.entities.length : 0) + ($scope.showProject[formId] ? 1 : 0);
		}

		// Remove the expected inputs for people that cannot edit.
		for (var formId in inputsStatus)
			for (var strDate in inputsStatus[formId]) {
				var isEmpty = true;
				for (var entityId in inputsStatus[formId][strDate]) {
					if (inputsStatus[formId][strDate][entityId] === 'expected' && !$scope.canEdit[entityId])
						delete inputsStatus[formId][strDate][entityId];
					else
						isEmpty = false;
				}

				if (isEmpty)
					delete inputsStatus[formId][strDate];
			}

		$scope.$watch('showFinished', function(showFinished) {
			// Remove rows that are finished
			if (showFinished) {
				$scope.inputsStatus = inputsStatus;
			}
			else {
				$scope.inputsStatus = angular.copy(inputsStatus);

				for (var formId in $scope.inputsStatus)
					for (var strDate in $scope.inputsStatus[formId]) {
						var isAllDone = true;

						if (typeof $scope.inputsStatus[formId][strDate] === 'string')
							isAllDone = $scope.inputsStatus[formId][strDate] === 'done';
						else
							for (var entityId in $scope.inputsStatus[formId][strDate])
								if ($scope.inputsStatus[formId][strDate][entityId] !== 'done') {
									isAllDone = false;
									break;
								}

						if (isAllDone)
							delete $scope.inputsStatus[formId][strDate];
					}
			}
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
		var projectUser = $scope.project.users.find(function(u) {
			return ($scope.userCtx.type == 'user' && u.id == $scope.userCtx._id) || ($scope.userCtx.type == 'partner' && u.username == $scope.userCtx.username);
		});

		if ($scope.userCtx.type == 'user' && $scope.userCtx.roles.indexOf('_admin') !== -1)
			$scope.canEdit = true;
		else if (!projectUser)
			$scope.canEdit = false;
		else {
			var role = projectUser.role;
			if (role == 'owner' || role == 'input_all')
				$scope.canEdit = true;
			else if (role == 'input')
				$scope.canEdit = projectUser.entities.indexOf($scope.currentInput.entity) != -1;
			else if (role == 'read')
				$scope.canEdit = false;
			else
				throw new Error('invalid role');
		}

		// Handle rotations.
		$scope.partitions = {};
		$scope.rotations  = {};
		$scope.positions  = {};

		$scope.move = function(offset, element) {
			var numPositions = element.partitions.length - 1;
			$scope.positions[element.id]
				= window.localStorage['input.position.' + element.id]
				= ((($scope.positions[element.id] + offset) % numPositions) + numPositions) % numPositions;
		};

		$scope.rotate = function(offset, element) {
			var numPermutations = Math.factorial(element.partitions.length);
			$scope.rotations[element.id]
				= window.localStorage['input.rotation.' + element.id]
				= ((($scope.rotations[element.id] + offset) % numPermutations) + numPermutations) % numPermutations;

			$scope.partitions[element.id] = computeNthPermutation(element.partitions.length, $scope.rotations[element.id]).map(function(i) { return element.partitions[i]; });
		};

		form.elements.forEach(function(element) {
			$scope.rotations[element.id] = (window.localStorage['input.rotation.' + element.id] % Math.factorial(element.partitions.length)) || 0
			if (window.localStorage['input.position.' + element.id] != undefined)
				$scope.positions[element.id] = window.localStorage['input.position.' + element.id] % (element.partitions.length - 1);
			else
				$scope.positions[element.id] = Math.floor(element.partitions.length / 2)

			$scope.rotate(0, element)
			$scope.move(0, element)
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

		$scope.splits = {};
		$scope.onSplitClick = function(variableId, index) {
			if ($scope.splits[variableId] !== index)
				$scope.splits[variableId] = index;
			else
				delete $scope.splits[variableId];
		};

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// when input list change, or regrouping is needed, compute table rows again.
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.$watch('[filters, groupBy, splits]', function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end, $scope.filters.entityId, $scope.project)
			$scope.rows = mtReporting.computeActivityReporting(cubes, $scope.project, $scope.groupBy, $scope.filters, $scope.splits);
		}, true);
	})


	.controller('ProjectActivityDetailedReportingController', function($scope, $filter, Olap, inputs, mtReporting) {
		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};

		// Create default filter so that all inputs are used.
		$scope.filters = {};
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
		$scope.elements = [];
		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.elements.push({
					element: element,
					name: element.name,
					group: form.name
				})
			});
		});

		$scope.element  = $scope.elements[0].element;

		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.$watchGroup(['element', 'filters', 'groupBy'], function() {
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end)
			$scope.rows = mtReporting.computeDetailedActivityReporting(cubes, $scope.project, $scope.element, $scope.groupBy, $scope.filters);
		}, true);
	})

	.controller('ProjectActivityOlapController', function($scope, Olap, inputs) {
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		// default variable
		$scope.sources = [{id: null, name: "---", group: null}];
		$scope.project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				$scope.sources.push({id: element.id, name: element.name, group: form.name, element: element});
			});
		});


		$scope.planning = {variable: null };
		$scope.project.forms.forEach(function(form) {
			if (!$scope.planning.variable && form.elements.length)
				$scope.planning.variable = form.elements[0].id;
		});

		$scope.dates = {};
		$scope.dates.begin = new Date('9999-01-01T00:00:00Z')
		$scope.dates.end = new Date('0000-01-01T00:00:00Z');
		for (var i = 0; i < inputs.length; ++i) {
			if (inputs[i].period < $scope.dates.begin)
				$scope.dates.begin = inputs[i].period;
			if (inputs[i].period > $scope.dates.end)
				$scope.dates.end = inputs[i].period;
		}

		// When variable change, reset the whole query object.
		$scope.$watch('planning.variable', function(variableId) {
			var cube = cubes[variableId];
			$scope.dimensions = cube.dimensions;
			$scope.planning.cols = [];
			$scope.planning.rows = [];
			$scope.planning.filters = {};
			cube.dimensions.forEach(function(dimension) {
				$scope.planning.filters[dimension.id] = [];
			});
		});

		// when a date change, update related filters.
		// This is also underperformant as hell, but no worst than the olap implementation.
		$scope.$watch('[dates.begin,dates.end]', function() {
			var begin = moment($scope.dates.begin), end = moment($scope.dates.end),
				filters = {
					year: {begin: begin.format('YYYY'), end: end.format('YYYY')},
					quarter: {begin: begin.format('YYYY-[Q]Q'), end: end.format('YYYY-[Q]Q')},
					month: {begin: begin.format('YYYY-MM'), end: end.format('YYYY-MM')},
					week: {begin: begin.format('YYYY-[W]WW'), end: end.format('YYYY-[W]WW')},
					day: {begin: begin.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD')}
				};

			for (var key in filters) {
				var dimension = $scope.dimensions.find(function(dim) { return dim.id == key; });
				$scope.planning.filters[key] = dimension.items.pluck('id').filter(function(el) {
					return filters[key].begin <= el && el <= filters[key].end;
				});
			}
		}, true)

		// When a row,col,filter change, update the table.
		$scope.$watch('[planning.rows,planning.cols,planning.filters]', function() {
			// update available rows and cols
			var timeFields = ['year', 'quarter', 'month', 'week', 'day'],
				timeUsedOnCols = timeFields.find(function(tf) { return $scope.planning.cols.indexOf(tf) !== -1; }),
				timeUsedOnRows = timeFields.find(function(tf) { return $scope.planning.rows.indexOf(tf) !== -1; });
			
			$scope.availableCols = $scope.dimensions.filter(function(dimension) {
				if (timeFields.indexOf(dimension.id) !== -1)
					return timeUsedOnCols == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return $scope.planning.rows.indexOf(dimension.id) == -1;
			});

			$scope.availableRows = $scope.dimensions.filter(function(dimension) {
				if (timeFields.indexOf(dimension.id) !== -1)
					return timeUsedOnRows == dimension.id || (!timeUsedOnRows && !timeUsedOnCols);
				else
					return $scope.planning.cols.indexOf(dimension.id) == -1;
			});

			// Execute query.
			var makeRowCol = function(selectedDimId) {
				var dimension = $scope.dimensions.find(function(dim) { return dim.id == selectedDimId; });
				return {items: dimension.items.filter(function(dimItem) {
					return !filters[dimension.id] || filters[dimension.id].indexOf(dimItem.id) !== -1;
				})};
			};

			var dimensionsIds = $scope.planning.cols.concat($scope.planning.rows);
			var filters = {};
			for (var key in $scope.planning.filters)
				if ($scope.planning.filters[key].length !== 0)
					filters[key] = $scope.planning.filters[key];
			
			$scope.display = {
				data: cubes[$scope.planning.variable].query(dimensionsIds, filters),
				cols: $scope.planning.cols.map(makeRowCol),
				rows: $scope.planning.rows.map(makeRowCol),
				filters: filters
			};

			// work around grid bug...
			if ($scope.display.rows.length === 0) {
				$scope.display.rows = $scope.display.cols;
				$scope.display.cols = [];
			}
		}, true);

	});
