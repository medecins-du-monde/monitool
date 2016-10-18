"use strict";

angular
	.module(
		'monitool.controllers.project.structure',
		[
		]
	)

	.controller('ProjectMenuController', function($scope, $state, $stateParams, $filter, $rootScope, project, uuid) {
		$scope.master = angular.copy(project);	// Last saved version of the project, or empty one.
		$scope.project = project;				// Current version of project.
		$scope.projectSaveRunning = false;		// We are not currently saving.
		$scope.formContainer = {currentForm: null};

		$scope.showStructure = !project._rev;

		// When master changes, update menu elements, and save flags
		var masterWatch = $scope.$watch('master', function() {
			$scope.projectHasIndicators = $scope.master.hasObjectiveReporting();
			$scope.projectActivityReady = $scope.master.hasActivityReporting();
		});

		// When project changes, update save flags
		var onProjectChange = function() {
			$scope.projectChanged = !angular.equals($scope.master, $scope.project);

			$scope.projectSavable = $scope.projectChanged;
			if ($scope.formContainer.currentForm)
				$scope.projectSavable = $scope.projectSavable && !$scope.formContainer.currentForm.$invalid;
		};

		var projectWatch = $scope.$watch('project', onProjectChange, true);
		var formWatch = $scope.$watch('formContainer.currentForm', onProjectChange);

		// Restore $scope.master to avoid unsaved changes from a given page to pollute changes to another one.
		var pageChangeWatch = $scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
			// If project is currently saving, disable all links
			if ($scope.projectSaveRunning) {
				e.preventDefault();
				return;
			}

			// If project is changed, warn user that changes will be lost.
			if ($scope.projectChanged) {
				// then ask the user if he meant it
				if (window.confirm($filter('translate')('shared.sure_to_leave')))
					$scope.reset();
				else
					e.preventDefault();
			}

			$scope.formContainer.currentForm = null;
		});

		$scope.cloneProject = function() {
			var newName = window.prompt($filter('translate')('project.please_enter_new_name'));

			if (newName)
				$scope.project.clone(newName)
					.$save()
					.then(function() { $state.go('main.projects'); })
					.catch(function(error) { $scope.error = error; });
		};

		$scope.deleteProject = function() {
			var translate = $filter('translate'),
				question  = translate('project.are_you_sure_to_delete'),
				answer    = translate('project.are_you_sure_to_delete_answer');

			if (window.prompt(question) === answer) {
				// Remove all watchs before deleting, to avoid errors
				masterWatch();
				projectWatch();
				pageChangeWatch();

				// Delete project
				project.$delete(function() {
					// Go back to project list.
					$state.go('main.projects');
				});
			}
		};

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			// When button is disabled, do not execute action.
			if (!$scope.projectSavable || $scope.projectSaveRunning)
				return;

			$scope.projectSaveRunning = true;

			return $scope.project.$save().then(function() {
				$scope.master = angular.copy($scope.project);
				$scope.projectChanged = false;
				$scope.projectSavable = false;
				$scope.projectSaveRunning = false;

			}).catch(function(error) {
				// Display message to tell user that it's not possible to save.
				var translate = $filter('translate');
				alert(translate('project.saving_failed'));

				// reload page.
				window.location.reload();
			});
		};

		$scope.reset = function() {
			// When button is disabled, do not execute action.
			if (!$scope.projectChanged || $scope.projectSaveRunning)
				return;

			// Clone last saved version of project.
			angular.copy($scope.master, $scope.project);
		};
	})

	.controller('ProjectBasicsController', function($scope, themes) {
		$scope.themes = themes;

		$scope.startDateOptions = {maxDate: $scope.project.end};
		$scope.endDateOptions = {minDate: $scope.project.start};

		// Pass form to parent controller for validation (a bit hacky)
		var unwatch = $scope.$watch('projectForm', function(projectForm) {
			if (projectForm) {
				$scope.formContainer.currentForm = projectForm;
				unwatch();
			}
		});


	})

	.controller('ProjectCollectionSiteListController', function($scope, $filter, Input, project) {
		var unwatch = $scope.$watch('projectForm', function(projectForm) {
			if (projectForm) {
				$scope.formContainer.currentForm = projectForm;
				unwatch();
			}
		});

		$scope.createEntity = function() {
			$scope.project.createEntity();
		};

		$scope.deleteEntity = function(entityId) {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_entity", projectId: project._id, entityId: entityId}).$promise.then(function(inputIds) {
				var question = $filter('translate')('project.delete_entity', {num_inputs: inputIds.length}),
					answer   = $filter('translate')('project.delete_entity_answer', {num_inputs: inputIds.length});

				var really = inputIds.length == 0 || (inputIds.length && window.prompt(question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really)
					$scope.project.removeEntity(entityId);
			});
		};

		$scope.createGroup = function() {
			$scope.project.createGroup();
		};

		$scope.deleteGroup = function(groupId) {
			$scope.project.removeGroup(groupId);
		};
	})

	.controller('ProjectUserListController', function($scope, $uibModal, users) {
		$scope.users = {};
		users.forEach(function(user) { $scope.users[user._id] = user});
		
		$scope.availableEntities = [{id: 'none', name: 'shared.project'}].concat($scope.project.entities);

		$scope.editUser = function(user) {
			var promise = $uibModal.open({
				controller: 'ProjectUserModalController',
				templateUrl: 'partials/projects/structure/user-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {
					users: function() { return users; },
					user: function() { return user; }
				}
			}).result;

			promise.then(function(newUser) {
				if (user && !newUser)
					$scope.project.users.splice($scope.project.users.indexOf(user), 1);
				else if (!user && newUser)
					$scope.project.users.push(newUser);
				else if (user && newUser)
					$scope.project.users.splice($scope.project.users.indexOf(user), 1, newUser);
			});
		};

		$scope.editIndicator = function(planning, parent) {
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/structure/edition-modal.html',
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


	.controller('ProjectCrossCuttingController', function($scope, $q, $uibModal, indicators, themes) {
		$scope.themes = themes.filter(function(t) { return $scope.project.themes.indexOf(t._id) !== -1; });

		var classes = ["label-primary", "label-success", "label-info", "label-warning", "label-danger"];
		$scope.themes.forEach(function(theme, index) {
			theme.class = classes[index % classes.length];
		});

		$scope.indicators = indicators;

		// Remove all themes that are not related to this project
		$scope.indicators.forEach(function(i) {
			i.themes = i.themes.filter(function(t) { return $scope.project.themes.indexOf(t) !== -1; });
		});

		$scope.indicators = $scope.indicators.filter(function(i) {
			return i.themes.length;
		});

		$scope.getName = function(a) { return a.name[$scope.language]; };

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId) {
			var planning = $scope.project.crossCutting[indicatorId];
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/structure/edition-modal-short.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {
					planning: function() { return planning; },
					indicator: function() { return indicators.find(function(i) { return i._id == indicatorId; }); }
				}
			}).result;

			promise.then(function(newPlanning) {
				if (planning && !newPlanning)
					delete $scope.project.crossCutting[indicatorId];
				else if (!planning && newPlanning)
					$scope.project.crossCutting[indicatorId] = newPlanning;
				else if (planning && newPlanning)
					$scope.project.crossCutting[indicatorId] = newPlanning;
			});
		};
	})

	.controller('ProjectLogicalFrameListController', function($scope, $state) {
		$scope.createLogicalFrame = function() {

			var newLogicalFrame = {name: '', goal: '', indicators: [], purposes: []};
			$scope.project.logicalFrames.push(newLogicalFrame);
			$state.go('main.project.structure.logical_frame_edition', {index: $scope.project.logicalFrames.length - 1});
		};
	})

	.controller('ProjectLogicalFrameEditController', function($scope, $q, $state, $stateParams, $filter, $timeout, $uibModal) {

		/////////////////////
		// Allow purposes, outputs and indicators reordering. We need to hack around bugs
		// in current Sortable plugin implementation.
		// @see https://github.com/RubaXa/Sortable/issues/581
		// @see https://github.com/RubaXa/Sortable/issues/722
		/////////////////////

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
		
		$scope.logicalFrameIndex = $stateParams.index;
		
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
				templateUrl: 'partials/projects/structure/edition-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {planning: function() { return planning; }, indicator: function() { return null; }}
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

		var w1 = $scope.$watch('project.logicalFrames[logicalFrameIndex]', function(form) {
			if (!form) {
				w1();
				$state.go('main.project.structure.logical_frame_list');
			}
		});


		$scope.deleteLogicalFrame = function() {
			// Translate confirmation messages.
			var easy_question = $filter('translate')('project.delete_logical_frame');

			// Ask confirmation to user
			if (window.confirm(easy_question)) {
				// Kill the watches
				w1();

				// Remove the form
				$scope.project.logicalFrames.splice($scope.logicalFrameIndex, 1);

				// Give some time for the watches to update the flags
				$timeout(function() {
					$scope.$parent.save().then(function() {
						$state.go('main.project.structure.logical_frame_list');
					});
				});
			}
		};

	})

	.controller('ProjectIndicatorEditionModalController', function($scope, $uibModalInstance, Parser, planning, indicator) {
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
		$scope.indicator = indicator;
		if (!indicator)
			$scope.planning = planning ? angular.copy(planning) : {
				display: '',
				colorize: true,
				baseline: null,
				target: null,
				unit: 'none',
				targetType: 'higher_is_better',
				formula: "a",
				parameters: {'a': {elementId: null, filter: {}}}
			};
		else
			$scope.planning = planning ? angular.copy(planning) : {
				formula: "a",
				parameters: {'a': {elementId: null, filter: {}}}
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



	.controller('ProjectUserModalController', function($scope, $uibModalInstance, users, user) {
		$scope.availableUsers = users.filter(function(availableUser) {
			// user that is currently selected, if there is one.
			if (user && availableUser._id == user.id)
				return true;

			// other user on the list.
			if ($scope.project.users.find(function(u) { return u.id == availableUser._id; }))
				return false;

			// other user
			return true;
		});

		$scope.isNew = !user;
		$scope.user = user ? angular.copy(user) : {
			type: "internal",
			id: null,
			role: "owner",
			entities: []
		};

		$scope.partners = $scope.project.users.filter(function(projectUser) {
			return projectUser.type == 'partner' && projectUser.username !== $scope.user.username;
		}).map(function(projectUser) {
			return projectUser.username;
		});

		$scope.done = function() {
			if ($scope.user.type == 'internal') {
				delete $scope.user.login;
				delete $scope.user.password;
			}
			else
				delete $scope.user.id;

			if ($scope.user.role != 'input')
				delete $scope.user.entities;

			$uibModalInstance.close($scope.user);
		};

		$scope.delete = function() { $uibModalInstance.close(null); };
		$scope.cancel = function() { $uibModalInstance.dismiss() };
	})

	.controller('ProjectCollectionFormListController', function($scope, $state, uuid) {
		$scope.createForm = function() {
			var newForm = {id: uuid.v4(), name: '', periodicity: 'month', collect: 'entity', start: null, end: null, elements: []};
			$scope.project.forms.push(newForm);
			$state.go('main.project.structure.collection_form_edition', {formId: newForm.id});
		};
	})

	.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, $uibModal, $timeout, formUsage, uuid) {

		/////////////////////
		// Pass the form to the shared controller over it, to be able
		// to enable and disable the save button.
		/////////////////////
		
		var unwatchPassForm = $scope.$watch('dataSourceForm', function(dataSourceForm) {
			if (dataSourceForm) {
				$scope.formContainer.currentForm = dataSourceForm;
				unwatchPassForm();
			}
		});
		
		/////////////////////
		// Allow variables, partitions, elements and groups reordering.
		// We need to hack around bugs in current Sortable plugin implementation.
		// @see https://github.com/RubaXa/Sortable/issues/581
		// @see https://github.com/RubaXa/Sortable/issues/722
		/////////////////////
		
		$scope.variableSortOptions = {handle: '.variable-handle'};

		$scope.dragStart = function() { document.body.classList.add('dragging'); };
		$scope.dragEnd = function() { document.body.classList.remove('dragging'); };

		$scope.onSortableMouseEvent = function(enter) {
			$scope.variableSortOptions.disabled = enter;
		};

		// Put the form index in the scope to be able to access it without searching each time.
		$scope.currentFormIndex = $scope.project.forms.findIndex(function(f) { return f.id == $stateParams.formId; });

		// The number of inputs is used to show a warning message to user if they risk loosing data.
		$scope.numInputs = formUsage.length;

		// The delete button ask for confirmation when data will be lost.
		$scope.deleteForm = function() {
			// Translate confirmation messages.
			var easy_question = $filter('translate')('project.delete_form_easy'),
				hard_question = $filter('translate')('project.delete_form_hard', {num_inputs: formUsage.length}),
				answer = $filter('translate')('project.delete_form_hard_answer', {num_inputs: formUsage.length});

			// Ask confirmation to user (simple confirmation if no inputs were entered, copy a string if inputs will be lost).
			var really = (formUsage.length == 0 && window.confirm(easy_question))
				|| (formUsage.length && window.prompt(hard_question) == answer);

			// If user is OK with the data lost, remove the form, save and go back to the list of forms.
			if (really) {
				// Kill the watches
				w1(); w2(); w3();

				// Remove the form
				$scope.project.forms.splice($scope.currentFormIndex, 1);

				// Give some time for the watches to update the flags
				$timeout(function() {
					$scope.$parent.save().then(function() {
						$state.go('main.project.structure.collection_form_list');
					});
				});
			}
		};

		// Watch currentForm. If undefined, means that user clicked "cancel changes" on a new project.
		var w1 = $scope.$watch('project.forms[currentFormIndex]', function(form) {
			if (!form) {
				w1(); w2(); w3();
				$state.go('main.project.structure.collection_form_list');
			}
		});

		// Watch currentForm.collect to empty the list of sites this form will be used in.
		var w2 = $scope.$watch('project.forms[currentFormIndex].collect', function(collect) {
			if (collect === 'some_entity' && !$scope.project.forms[$scope.currentFormIndex].entities)
				$scope.project.forms[$scope.currentFormIndex].entities = [];
			else if (collect !== 'some_entity' && $scope.project.forms[$scope.currentFormIndex].entities)
				delete $scope.project.forms[$scope.currentFormIndex].entities;
		});

		// Watch form to invalidate HTML form on some conditions
		var w3 = $scope.$watch('project.forms[currentFormIndex].elements.length', function(length) {
			// A datasource is valid only when containing one or more variables.
			$scope.dataSourceForm.$setValidity('elementsLength', length >= 1);
		});

		$scope.editPartition = function(currentList, currentPartition) {
			$uibModal.open({
				controller: 'PartitionEditionModalController',
				templateUrl: 'partials/projects/structure/partition-modal.html',
				size: 'lg',
				resolve: { currentPartition: function() { return currentPartition; } }
			}).result.then(function(updatedPartition) {
				if (currentPartition && !updatedPartition)
					currentList.splice(currentList.indexOf(currentPartition), 1);
				else if (currentPartition && updatedPartition)
					currentList[currentList.indexOf(currentPartition)] = updatedPartition;
				else if (!currentPartition && updatedPartition)
					currentList.push(updatedPartition);
			});
		};

		$scope.newVariable = function() {
			$scope.project.forms[$scope.currentFormIndex].elements.push({
				id: uuid.v4(), name: "", partitions: [], order: 0, distribution: 0, geoAgg: 'sum', timeAgg: 'sum'
			});
		};
		
		$scope.remove = function(item, target) {
			var index = target.findIndex(function(arrItem) { return item.id === arrItem.id; });
			if (index !== -1)
				target.splice(index, 1)
		};
	})

	.controller('PartitionEditionModalController', function($scope, $uibModalInstance, currentPartition, uuid) {
		$scope.isNew = false;
		if (!currentPartition) {
			currentPartition = {
				id: uuid.v4(),
				name: "",
				elements: [{id: uuid.v4(), name: ""}, {id: uuid.v4(), name: ""}],
				groups: [],
				aggregation: "sum"
			}
			$scope.isNew = true;
		}

		$scope.master = currentPartition;
		$scope.partition = angular.copy(currentPartition);
		$scope.useGroups = !!$scope.partition.groups.length;

		$scope.$watch('useGroups', function(value) {
			if (!value)
				$scope.partition.groups = [];
		});

		$scope.$watch('partition.elements.length', function(length) {
			$scope.partitionForm.$setValidity('elementLength', length >= 2);
		});

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.partition);
		};

		$scope.save = function() {
			$uibModalInstance.close($scope.partition);
		};

		$scope.reset = function() {
			$scope.partition = angular.copy($scope.master);
			$scope.useGroups = !!$scope.partition.groups.length;
		};

		$scope.createPartitionElement = function() {
			$scope.partition.elements.push({id: uuid.v4(), name: ''});
		};

		$scope.deletePartitionElement = function(partitionElementId) {
			// Remove from element list
			$scope.partition.elements = $scope.partition.elements.filter(function(element) {
				return element.id !== partitionElementId;
			});

			// Remove from all groups
			$scope.partition.groups.forEach(function(group) {
				group.members = group.members.filter(function(member) {
					return member !== partitionElementId;
				});
			});
		};

		$scope.createGroup = function() {
			$scope.partition.groups.push({id: uuid.v4(), name: '', members: []});
		};

		$scope.deleteGroup = function(partitionGroupId) {
			$scope.partition.groups = $scope.partition.groups.filter(function(group) {
				return group.id !== partitionGroupId;
			});
		};

		$scope.delete = function() {
			$uibModalInstance.close(null);
		};
	})
