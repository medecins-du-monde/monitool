/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

angular
	.module(
		'monitool.controllers.project.structure',
		[
		]
	)


	/**
	 * Controller used by "main.project.structure" state.
	 *
	 * It handles:
	 * 		- A warning when the user try to change current page without saving changes.
	 *		- Form validation + save & reset" buttons
	 */
	.controller('ProjectEditController', function($scope, $filter, indicators) {
		$scope.editableProject = angular.copy($scope.masterProject);	// Current version of project.
		$scope.projectSaveRunning = false;				// We are not currently saving.
		$scope.formContainer = {currentForm: null};

		// When project changes, update save flags
		var onProjectChange = function() {
			$scope.projectChanged = !angular.equals($scope.masterProject, $scope.editableProject);

			$scope.projectSavable = $scope.projectChanged;
			if ($scope.formContainer.currentForm)
				$scope.projectSavable = $scope.projectSavable && $scope.formContainer.currentForm.$valid;
		};

		var projectWatch = $scope.$watch('editableProject', onProjectChange, true);
		var formWatch = $scope.$watch('formContainer.currentForm.$valid', onProjectChange);

		// Restore $scope.master to avoid unsaved changes from a given page to pollute changes to another one.
		$scope.$on('$stateChangeStart', function(e, toState, toParams, fromState, fromParams) {
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

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function(force) {
			// When button is disabled, do not execute action.
			if (!force) {
				if (!$scope.projectSavable || $scope.projectSaveRunning)
					return;
			}

			$scope.projectSaveRunning = true;
			$scope.editableProject.sanitize(indicators);

			return $scope.editableProject.$save()
				.then(function() {
					angular.copy($scope.editableProject, $scope.masterProject);
					$scope.projectChanged = false;
					$scope.projectSavable = false;
					$scope.projectSaveRunning = false;
					$scope.$broadcast('projectSaved');
				})
				.catch(function(error) {
					// Display message to tell user that it's not possible to save.
					var translate = $filter('translate');
					alert(translate('project.saving_failed'));

					$scope.projectSaveRunning = false;
				});
		};

		$scope.reset = function() {
			// When button is disabled, do not execute action.
			if (!$scope.projectChanged || $scope.projectSaveRunning)
				return;

			// Clone last saved version of project.
			angular.copy($scope.masterProject, $scope.editableProject);
			$scope.$broadcast('projectReset');
		};
	})

	/**
	 * Controller used by the "main.project.structure.basics" state.
	 * Allows to change basic informations.
	 */
	.controller('ProjectBasicsController', function($scope, themes) {
		$scope.themes = themes;
		$scope.startDateOptions = {maxDate: $scope.editableProject.end};
		$scope.endDateOptions = {minDate: $scope.editableProject.start};

		// Pass form to parent controller for validation (a bit hacky)
		$scope.$watch('projectForm', function(projectForm) {
			$scope.formContainer.currentForm = projectForm;
		});
	})


	/**
	 * Controller used by the "main.project.structure.collection_site_list" state.
	 * Allows to change entities and groups.
	 */
	.controller('ProjectCollectionSiteListController', function($scope, $filter, Input) {
		// Pass form to parent controller for validation (a bit hacky)
		$scope.$watch('projectForm', function(projectForm) {
			$scope.formContainer.currentForm = projectForm;
		});

		$scope.createEntity = function() {
			$scope.editableProject.createEntity();
		};

		$scope.deleteEntity = function(entityId) {
			// Fetch this forms inputs.
			Input.query({mode: "ids_by_entity", projectId: $scope.editableProject._id, entityId: entityId}).$promise.then(function(inputIds) {
				var question = $filter('translate')('project.delete_entity', {num_inputs: inputIds.length}),
					answer   = $filter('translate')('project.delete_entity_answer', {num_inputs: inputIds.length});

				var really = inputIds.length == 0 || (inputIds.length && window.prompt(question) == answer);

				// If there are none, just confirm that the user wants to do this for real.
				if (really)
					$scope.editableProject.removeEntity(entityId);
			});
		};

		$scope.createGroup = function() {
			$scope.editableProject.createGroup();
		};

		$scope.deleteGroup = function(groupId) {
			$scope.editableProject.removeGroup(groupId);
		};
	})

	/**
	 * Controller used by the "main.project.structure.user_list" state.
	 * Allows to list and reorder users that can access/edit the project.
	 */
	.controller('ProjectUserListController', function($scope, $uibModal, $filter, users) {

		$scope.users = {};
		users.forEach(function(user) { $scope.users[user._id] = user});

		$scope.editUser = function(user) {
			var promise = $uibModal.open({
				controller: 'ProjectUserModalController',
				templateUrl: 'partials/projects/structure/user-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: { allUsers: function() { return users; }, projectUser: function() { return user; } }
			}).result;

			promise.then(function(newUser) {
				if (user && !newUser) // Delete
					$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1);
				else if (!user && newUser) // Add
					$scope.editableProject.users.push(newUser);
				else if (user && newUser) // Replace
					$scope.editableProject.users.splice($scope.editableProject.users.indexOf(user), 1, newUser);
			});
		};
	})

	/**
	 * Controller used on a modal called from "main.project.structure.user_list"
	 * Allows to edit a user
	 */
	.controller('ProjectUserModalController', function($scope, $uibModalInstance, allUsers, projectUser) {
		// Build the list of users that are available on the select box
		// Available users are user that are not already taken (besides current one).
		$scope.availableUsers = allUsers.filter(function(user) {
			var isTakenInProject = $scope.editableProject.users.find(function(u) { return u.id == user._id; }),
				isTakenByMe      = projectUser && projectUser.id === user._id;

			return isTakenByMe || !isTakenInProject;
		});

		// Build the list of forbidden usernames if creating a partner account.
		$scope.partners = $scope.editableProject.users.filter(function(u) {
			if (projectUser)
				return u.type == 'partner' && u.username !== projectUser.username;
			else
				return u.type == 'partner';
		}).pluck('username');

		// isNew will be used by the view to disable inputs that can't be changed (username, etc), and show delete button.
		$scope.isNew = !projectUser;

		// The form updates a copy of the object, so that user can cancel the changes by just dismissing the modal.
		$scope.user = projectUser ? angular.copy(projectUser) : {type: "internal", id: null, role: "owner", entities: [], dataSources: []};
		if (!$scope.user.entities)
			$scope.user.entities = [];
		if (!$scope.user.dataSources)
			$scope.user.dataSources = [];

		$scope.masterUser = angular.copy($scope.user);

		$scope.isUnchanged = function() {
			return angular.equals($scope.masterUser, $scope.user);
		};

		$scope.reset = function() {
			angular.copy($scope.masterUser, $scope.user);
		}

		$scope.done = function() {
			if ($scope.user.type == 'internal') {
				delete $scope.user.login;
				delete $scope.user.password;
			}
			else
				delete $scope.user.id;

			if ($scope.user.role != 'input') {
				delete $scope.user.entities;
				delete $scope.user.dataSources;
			}

			$uibModalInstance.close($scope.user);
		};

		$scope.delete = function() { $uibModalInstance.close(null); };
		$scope.cancel = function() { $uibModalInstance.dismiss(); };
	})


	/**
	 * Controller used by the "main.project.structure.collection_form_list" state.
	 * Allows to list and reorder data sources.
	 */
	.controller('ProjectCollectionFormListController', function($scope, $state, $filter, uuid) {

		$scope.availableEntities = $scope.masterProject.entities;

		$scope.createForm = function() {
			var newForm = {id: uuid.v4(), name: '', periodicity: 'month', entities: [], start: null, end: null, elements: []};
			$scope.editableProject.forms.push(newForm);
			$state.go('main.project.structure.collection_form_edition', {formId: newForm.id});
		};
	})

	/**
	 * Controller used by the "main.project.structure.collection_form_edit" state.
	 * Allows to edit a data sources.
	 */
	.controller('ProjectCollectionFormEditionController', function($scope, $state, $stateParams, $filter, $uibModal, $timeout, formUsage, uuid) {

		$scope.container = {}
		$scope.toggle = function(variableId) {
			if ($scope.container.visibleElement !== variableId)
				$scope.container.visibleElement = variableId;
			else
				$scope.container.visibleElement = null;
		}

		/////////////////////
		// Pass the form to the shared controller over it, to be able
		// to enable and disable the save button.
		/////////////////////
		$scope.$watch('dataSourceForm', function(dataSourceForm) {
			$scope.formContainer.currentForm = dataSourceForm;
		});

		// Put the form index in the scope to be able to access it without searching each time.
		$scope.currentFormIndex = $scope.editableProject.forms.findIndex(function(f) { return f.id == $stateParams.formId; });

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
				w1(); w3();

				// Remove the form
				$scope.editableProject.forms.splice($scope.currentFormIndex, 1);

				// Give some time for the watches to update the flags
				$timeout(function() {
					$scope.$parent.save(true).then(function() {
						$state.go('main.project.structure.collection_form_list');
					});
				});
			}
		};

		// Watch currentForm. If undefined, means that user clicked "cancel changes" on a new project.
		var w1 = $scope.$watch('editableProject.forms[currentFormIndex]', function(form) {
			if (!form) {
				w1(); w3();
				$state.go('main.project.structure.collection_form_list');
			}
		});

		// Watch form to invalidate HTML form on some conditions
		var w3 = $scope.$watch('editableProject.forms[currentFormIndex].elements.length', function(length) {
			// A datasource is valid only when containing one or more variables.
			$scope.dataSourceForm.$setValidity('elementsLength', length >= 1);
		});

		$scope.editPartition = function(element, currentPartition) {
			$uibModal.open({
				controller: 'PartitionEditionModalController',
				templateUrl: 'partials/projects/structure/partition-modal.html',
				size: 'lg',
				resolve: { currentPartition: function() { return currentPartition; } }
			}).result.then(function(updatedPartition) {
				var sizeChanged = false;

				// Partition was deleted
				if (currentPartition && !updatedPartition) {
					element.partitions.splice(element.partitions.indexOf(currentPartition), 1);
					sizeChanged = true;
				}
				// Partition was updated
				else if (currentPartition && updatedPartition)
					element.partitions[element.partitions.indexOf(currentPartition)] = updatedPartition;
				// Partition was added
				else if (!currentPartition && updatedPartition) {
					sizeChanged = true;
					element.partitions.push(updatedPartition);
				}

				if (sizeChanged) {
					element.distribution = Math.ceil(element.partitions.length / 2);
					element.order = 0;
				}
			});
		};

		$scope.newVariable = function() {
			var newVariable = {
				id: uuid.v4(), name: "", partitions: [], order: 0, distribution: 0, geoAgg: 'sum', timeAgg: 'sum'
			};

			$scope.editableProject.forms[$scope.currentFormIndex].elements.push(newVariable);
			$scope.toggle(newVariable.id);
		};

		$scope.remove = function(item, target) {
			var index = target.findIndex(function(arrItem) { return item.id === arrItem.id; });
			if (index !== -1)
				target.splice(index, 1)
		};
	})

	.controller('PartitionEditionModalController', function($scope, $uibModalInstance, $filter, currentPartition, uuid) {
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
		$scope.closedOnPurpose = false;

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
			$scope.closedOnPurpose = true;
			$uibModalInstance.close($scope.partition);
		};

		$scope.reset = function() {
			angular.copy($scope.master, $scope.partition);
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
			$scope.closedOnPurpose = true;
			$uibModalInstance.close(null);
		};

		$scope.closeModal = function() {
			$uibModalInstance.dismiss(null);
		};

		$scope.$on('modal.closing', function(event) {
			var hasChanged = !$scope.isUnchanged();
			var closedOnPurpose = $scope.closedOnPurpose;

			if (hasChanged && !closedOnPurpose) {
				var question = $filter('translate')('shared.sure_to_leave');
				var isSure = window.confirm(question);
				if (!isSure)
					event.preventDefault();
			}
		});
	})

	.controller('ProjectLogicalFrameListController', function($scope, $state) {

		$scope.createLogicalFrame = function(logicalFrame) {
			var newLogicalFrame;
			if (!logicalFrame)
				newLogicalFrame = {name: '', goal: '', start: null, end: null, indicators: [], purposes: []};
			else
				newLogicalFrame = angular.copy(logicalFrame);

			$scope.editableProject.logicalFrames.push(newLogicalFrame);
			$state.go('main.project.structure.logical_frame_edition', {index: $scope.editableProject.logicalFrames.length - 1});
		};

	})

	.controller('ProjectLogicalFrameEditController', function($scope, $state, $stateParams, $filter, $timeout, $uibModal) {

		/////////////////////
		// Allow purposes, outputs and indicators reordering. We need to hack around bugs
		// in current Sortable plugin implementation.
		// @see https://github.com/RubaXa/Sortable/issues/581
		// @see https://github.com/RubaXa/Sortable/issues/722
		/////////////////////

		$scope.purposeSortOptions = {group:'purposes', handle: '.purpose-handle'};
		$scope.outputSortOptions = {group:'outputs', handle: '.output-handle'};
		$scope.activitySortOptions = {group:'activities', handle: '.activity-handle'};
		$scope.indicatorsSortOptions = {
			group:'indicators',
			handle: '.indicator-handle',
			onStart: function() { document.body.classList.add('dragging'); },
			onEnd: function() { document.body.classList.remove('dragging'); }
		};

		$scope.onSortableMouseEvent = function(group, enter) {
			if (group == 'outputs')
				$scope.purposeSortOptions.disabled = enter;
			else if (group == 'activities')
				$scope.purposeSortOptions.disabled = $scope.outputSortOptions.disabled = enter;
			else if (group == 'indicators')
				$scope.purposeSortOptions.disabled = $scope.outputSortOptions.disabled = $scope.activitySortOptions = enter;
		};

		/////////////////////
		// Pass the form to the shared controller over it, to be able
		// to enable and disable the save button.
		/////////////////////

		var unwatch = $scope.$watch('projectForm', function(projectForm) {
			$scope.formContainer.currentForm = projectForm;
		});

		$scope.logicalFrameIndex = $stateParams.index;

		/////////////////////
		// Create and remove elements from logical frame
		/////////////////////

		$scope.addPurpose = function() {
			$scope.editableProject.logicalFrames[$scope.logicalFrameIndex].purposes.push({
				description: "", assumptions: "", indicators: [], outputs: []
			});
		};

		$scope.addOutput = function(purpose) {
			purpose.outputs.push({
				description: "", activities: [], assumptions: "", indicators: []
			});
		};

		$scope.addActivity = function(output) {
			output.activities.push({
				description: "", indicators: []
			});
		};

		$scope.remove = function(element, list) {
			list.splice(list.indexOf(element), 1);
		};

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.addIndicator = function(parent) {
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/structure/edition-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {planning: function() { return null; }, indicator: function() { return null; }}
			}).result;

			promise.then(function(newPlanning) {
				if (newPlanning)
					parent.push(newPlanning);
			});
		};

		var w1 = $scope.$watch('editableProject.logicalFrames[logicalFrameIndex]', function(form) {
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
				$scope.editableProject.logicalFrames.splice($scope.logicalFrameIndex, 1);
				$scope.$parent.save(true).then(function() {
					$state.go('main.project.structure.logical_frame_list');
				});
			}
		};
	})

	.controller('ProjectCrossCuttingController', function($scope, $uibModal, indicators, themes) {
		$scope.themes = [];

		// Create a category with indicators that match project on 2 thematics or more
		var manyThematicsIndicators = indicators.filter(function(indicator) {
			return indicator.themes.length > 1 && indicator.themes.filter(function(themeId) {
				return $scope.masterProject.themes.indexOf(themeId) !== -1;
			}).length > 0;
		});
		if (manyThematicsIndicators.length)
			$scope.themes.push({definition: null, indicators: manyThematicsIndicators});

		// Create a category with indicators that match project on exactly 1 thematic
		themes.forEach(function(theme) {
			if ($scope.masterProject.themes.indexOf(theme._id) !== -1) {
				var themeIndicators = indicators.filter(function(indicator) {
					return indicator.themes.length === 1 && indicator.themes[0] === theme._id;
				});

				if (themeIndicators.length !== 0)
					$scope.themes.push({definition: theme, indicators: themeIndicators});
			}
		});

		// This getter will be used by the orderBy directive to sort indicators in the partial.
		$scope.getName = function(indicator) {
			return indicator.name[$scope.language];
		};

		// Indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId) {
			var planning = $scope.editableProject.crossCutting[indicatorId];
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/structure/edition-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {
					planning: function() { return planning; },
					indicator: function() { return indicators.find(function(i) { return i._id == indicatorId; }); }
				}
			}).result;

			promise.then(function(newPlanning) {
				if (!newPlanning)
					delete $scope.editableProject.crossCutting[indicatorId];
				else
					$scope.editableProject.crossCutting[indicatorId] = newPlanning;
			});
		};
	})

	.controller('ProjectExtraIndicators', function($scope, $uibModal) {
		$scope.addIndicator = function() {
			var promise = $uibModal.open({
				controller: 'ProjectIndicatorEditionModalController',
				templateUrl: 'partials/projects/structure/edition-modal.html',
				size: 'lg',
				scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
				resolve: {planning: function() { return null; }, indicator: function() { return null; }}
			}).result;

			promise.then(function(newPlanning) {
				if (newPlanning)
					$scope.editableProject.extraIndicators.push(newPlanning);
			});
		};
	})


	.controller('ProjectIndicatorEditionModalController', function($scope, $uibModalInstance, planning, indicator) {
		$scope.indicator = indicator;
		$scope.planning = planning ? angular.copy(planning) : {
			display: '',
			colorize: true,
			baseline: null,
			target: null,
			computation: {
				formula: "copied_value",
				parameters: {
					copied_value: {
						elementId: null,
						filter: {}
					}
				}
			}
		};

		if ($scope.indicator)
			delete $scope.planning.display;

		$scope.masterPlanning = angular.copy($scope.planning);
		$scope.isUnchanged = function() {
			return angular.equals($scope.planning, $scope.masterPlanning);
		};

		$scope.reset = function() {
			angular.copy($scope.masterPlanning, $scope.planning);
		};

		$scope.isNew = !planning;

		$scope.save   = function() { $uibModalInstance.close($scope.planning); };
		$scope.delete = function() { $uibModalInstance.close(null); };
		$scope.cancel = function() { $uibModalInstance.dismiss(); };
	})

	.controller('ProjectRevisions', function($scope, Revision) {
		var currentOffset = 0, pageSize = 10;

		$scope.loading = false;
		$scope.revisions = [];

		// Listen to the project reset event to reset selectedIndex.
		$scope.$on('projectReset', function() {
			$scope.selectedIndex = -1;
		});

		// Listen to the project saved event to reload
		$scope.$on('projectSaved', function() {
			currentOffset = 0;
			$scope.selectedIndex = -1;
			$scope.revisions = [];
			$scope.showMore();
		});

		$scope.showMore = function() {
			if ($scope.loading)
				return;

			var params = {projectId: $scope.masterProject._id, offset: currentOffset, limit: pageSize};
			currentOffset = currentOffset + pageSize;
			$scope.loading = true;

			Revision.query(params).$promise.then(function(newRevisions) {
				$scope.loading = false;
				$scope.finished = newRevisions.length < pageSize;
				$scope.revisions = $scope.revisions.concat(newRevisions);
				Revision.enrich($scope.masterProject, $scope.revisions);
			});
		};

		$scope.restore = function(index) {
			$scope.selectedIndex = index;
			angular.copy($scope.revisions[index].before, $scope.editableProject);
		};

		$scope.showMore();
	})

