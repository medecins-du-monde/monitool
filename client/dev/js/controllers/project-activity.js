"use strict";

angular
	.module(
		'monitool.controllers.project.activity',
		[
			"monitool.services.olap",
			"ngSanitize",
			"ngHandsontable"
		]
	)

	.controller('ProjectCollectionSiteListController', function($scope, $filter, Input, project) {
		$scope.createEntity = function() {
			$scope.project.entities.push({id: makeUUID(), name: ''});
		};

		$scope.deleteEntity = function(entityId) {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_entity", entityId: entityId}).$promise.then(function(inputIds) {
				var question = $filter('translate')('project.delete_entity', {num_inputs: inputIds.length}),
					answer = $filter('translate')('project.delete_entity_answer', {num_inputs: inputIds.length});

				var really = inputIds.length == 0 || (inputIds.length && window.prompt(question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really) {
					$scope.project.entities = $scope.project.entities.filter(function(e) { return e.id !== entityId; });
					$scope.project.groups.forEach(function(group) {
						var index = group.members.indexOf(entityId);
						if (index !== -1)
							group.members.splice(index, 1);
					});
				}
			});
		};

		$scope.createGroup = function() {
			$scope.project.groups.push({id: makeUUID(), name: '', members: []});
		};

		$scope.deleteGroup = function(inputEntityId) {
			$scope.project.groups = $scope.project.groups.filter(function(entity) {
				return entity.id !== inputEntityId;
			});
		};

		$scope.up = function(index, array) {
			var element = array.splice(index, 1);
			array.splice(index - 1, 0, element[0]);
		};

		$scope.down = function(index, array) {
			var element = array.splice(index, 1);
			array.splice(index + 1, 0, element[0]);
		};
	})

	.controller('ProjectCollectionFormListController', function() {

	})

	.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, formUsage, form) {
		$scope.master = angular.copy(form);
		$scope.form = angular.copy(form); // FIXME one of those copies looks useless.
		$scope.formUsage = formUsage;
		$scope.formIndex = $scope.project.forms.findIndex(function(f) {
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

		$scope.$watch('form.sections', function(sections) {
			$scope.maxPartitions = 0;
			sections.forEach(function(section) {
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

		$scope.remPartition = function(partition, target) {
			target.splice(target.indexOf(partition), 1);
		};

		$scope.upSection = function(index) {
			if (index == 0)
				throw new Error();

			var element = $scope.form.sections[index];

			$scope.form.sections[index] = $scope.form.sections[index - 1];
			$scope.form.sections[index - 1] = element;
		};

		$scope.downSection = function(index) {
			if (index == $scope.form.sections.length - 1)
				throw new Error();

			var element = $scope.form.sections[index];
			$scope.form.sections[index] = $scope.form.sections[index + 1];
			$scope.form.sections[index + 1] = element;
		};

		$scope.upElement = function(index, parentIndex) {
			var element = $scope.form.sections[parentIndex].elements[index];
			$scope.form.sections[parentIndex].elements.splice(index, 1);

			if (index == 0)
				$scope.form.sections[parentIndex - 1].elements.push(element);
			else
				$scope.form.sections[parentIndex].elements.splice(index - 1, 0, element);
		};

		$scope.downElement = function(index, parentIndex) {
			var element = $scope.form.sections[parentIndex].elements[index];
			$scope.form.sections[parentIndex].elements.splice(index, 1);

			if ($scope.form.sections[parentIndex].elements.length == index)
				$scope.form.sections[parentIndex + 1].elements.unshift(element);
			else
				$scope.form.sections[parentIndex].elements.splice(index + 1, 0, element);
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
		$scope.canEdit = project.dataEntryOperators.indexOf($scope.userCtx._id) !== -1 || $scope.userCtx.roles.indexOf('_admin') !== -1;

		$scope.selectedForm = project.forms[0];
		$scope.showFinished = !$scope.canEdit;

		if (!$scope.canEdit) {
			for (var formId in inputsStatus)
				for (var strDate in inputsStatus[formId]) {
					if (inputsStatus[formId][strDate] === 'expected')
						delete inputsStatus[formId][strDate];
					else {
						var isEmpty = true;
						for (var entityId in inputsStatus[formId][strDate])
							if (inputsStatus[formId][strDate][entityId] === 'expected')
								delete inputsStatus[formId][strDate][entityId]
							else
								isEmpty = false;

						if (isEmpty)
							delete inputsStatus[formId][strDate];
					}
				}
		}

		$scope.$watch('showFinished', function(showFinished) {
			if (showFinished) {
				$scope.inputsStatus = inputsStatus;
			}
			else {
				$scope.inputsStatus = JSON.parse(JSON.stringify(inputsStatus));

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

	.controller('ProjectCollectionInputEditionController', function($scope, $state, mtReporting, form, inputs, indicatorsById) {
		$scope.form          = form;
		$scope.isNew         = inputs.isNew;
		$scope.currentInput  = inputs.current;
		$scope.previousInput = inputs.previous;
		$scope.inputEntity   = $scope.project.entities.find(function(entity) { return entity.id == $scope.currentInput.entity; });

		$scope.save = function() {
			$scope.currentInput.$save(function() { $state.go('main.project.collection_input_list'); });
		};

		$scope.delete = function() {
			$scope.currentInput.$delete(function() { $state.go('main.project.collection_input_list'); });
		};
	})

	.controller('ProjectActivityReportingController', function($scope, inputs, mtReporting) {
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

		// When filter changes (or init), build the list of inputs to pass to the scope.
		$scope.$watch('filters', function() {
			// find a group that match the entityId.
			var entityFilter = null;
			if ($scope.filters.entityId) {
				var group = $scope.project.groups.find(function(g) { return g.id == $scope.filters.entityId; });
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
			var reporting = mtReporting.computeProjectReporting($scope.inputs, $scope.project, $scope.groupBy);
			$scope.cols = mtReporting.getColumns($scope.groupBy, $scope.filters.begin, $scope.filters.end, $scope.filters.entityId, $scope.project)
			$scope.rows = [];

			$scope.project.forms.forEach(function(form) {
				$scope.rows.push({ id: form.id, type: "header", text: form.name, indent: 0 });
				form.sections.forEach(function(section) {
					$scope.rows.push({ id: section.id, type: "header", text: section.name, indent: 1 });
					section.elements.forEach(function(variable) {
						var row = {};
						row.id = variable.id;
						row.type = "data";
						row.name = variable.name;
						row.indent = 2;
						
						row.partitions = variable.partitions.map(function(p, index) {
							return {
								index: index,
								name: p.map(function(p) {
									return p.name.substring(0, 1).toLocaleUpperCase();
								}).join('/'),
								fullname: p.pluck('name').join(' / ')
							}
						});

						row.cols = $scope.cols.map(function(col) {
							try { return reporting[col.id][variable.id]; }
							catch (e) { return undefined; }
						});

						$scope.rows.push(row);

						if ($scope.splits[row.id] !== undefined) {
							var partitionIndex = $scope.splits[row.id];

							variable.partitions[partitionIndex].forEach(function(part) {
								var childRow = {};
								childRow.id = variable.id + '.' + partitionIndex + '/' + part.id;
								childRow.type = "data";
								childRow.name = part.name;
								childRow.indent = 3;

								childRow.partitions = row.partitions.slice();
								childRow.partitions.splice(partitionIndex, 1); // remove the already chosen partition

								childRow.cols = $scope.cols.map(function(col) {
									try { return reporting[col.id][variable.id + '.' + part.id]; }
									catch (e) { return undefined; }
								})

								$scope.rows.push(childRow);

								if ($scope.splits[childRow.id] !== undefined) {
									var childPartitionIndex = $scope.splits[childRow.id];

									variable.partitions[childPartitionIndex].forEach(function(subPart) {
										var subChildRow = {};
										subChildRow.id = variable.id + '.' + partitionIndex + '/' + part.id + '.' + childPartitionIndex + '/' + subPart.id;
										subChildRow.type = "data";
										subChildRow.name = subPart.name;
										subChildRow.indent = 4;

										subChildRow.cols = $scope.cols.map(function(col) {
											var id = variable.id + '.' + [part.id, subPart.id].sort().join('.');
											try { return reporting[col.id][id]; }
											catch (e) { return undefined; }
										})

										$scope.rows.push(subChildRow);
									});
								}
							});
						}
					});
				});
			});
		});

		$scope.splits = {};
		$scope.onSplitClick = function(variableId, index) {
			if ($scope.splits[variableId] !== index)
				$scope.splits[variableId] = index;
			else
				delete $scope.splits[variableId];

			$scope.inputs = $scope.inputs.slice(); // don't leave this hack here or kittens will die horribly
		};

		// This hash allows to select indicators for plotting. It is used by directives.
		$scope.plots = {};
	})

	.controller('ProjectActivityOlapController', function($scope, Olap, inputs) {
		var cubes = Olap.Cube.fromProject($scope.project, inputs);

		$scope.planning = {variable: null };
		$scope.project.forms.forEach(function(form) {
			form.sections.forEach(function(section) {
				if (!$scope.planning.variable && section.elements.length)
					$scope.planning.variable = section.elements[0].id;
			});
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

	})