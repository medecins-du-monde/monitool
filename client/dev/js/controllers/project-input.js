"use strict";

angular.module('monitool.controllers.project.input', [])

	.controller('ProjectCollectionInputListController', function($scope, $state, form, project, inputsStatus, Input) {
		$scope.formId = form.id;
		$scope.form=form;
		$scope.inputsStatus = inputsStatus;

		// pass information needed for creating new inputs on free forms.
		$scope.newInputDate = {date: new Date(Math.floor(Date.now() / 86400000) * 86400000)};
		
		$scope.addInput = function(entityId) {
			$state.go(
				'main.project.input.edit',
				{
					period: $scope.newInputDate.date.toISOString().substring(0, 10),
					formId: form.id,
					entityId: entityId
				}
			);
		};

		// Write hash with metadata on columns to know if we need to display them.
		$scope.displayInfo = {};
		$scope.displayInfo._ = { displayFooterRow: false, numCols: 1 };

		['none'].concat(project.entities.pluck('id')).forEach(function(columnId) {
			//////////////////////
			// List data that we need to decide if we will display this column and how.
			//////////////////////
			var hasExpectedInputs, hasPreviousInputs, isRelevantToForm, isAllowed;

			// Check inputsStatus to know if we had previous or expected inputs.
			hasExpectedInputs = hasPreviousInputs = false;
			for (var strDate in inputsStatus) {
				var inputStatus = inputsStatus[strDate][columnId];
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
				for (var strDate in inputsStatus) {
					if (inputsStatus &&
						inputsStatus[strDate] &&
						inputsStatus[strDate][columnId] === 'expected')
						delete inputsStatus[strDate][columnId];

					if (angular.equals(inputsStatus[strDate], {}))
						delete inputsStatus[strDate];
				}

			}
			// if (angular.equals(inputsStatus, {}))
			// 	delete inputsStatus;

			// Create entry in columns by form.
			$scope.displayInfo[columnId] = {
				displayColumn: hasPreviousInputs || isRelevantToForm,
				canEdit: isAllowed && isRelevantToForm,
				displayAddButton: form.periodicity == 'free' && isAllowed && isRelevantToForm
			};

			if ($scope.displayInfo[columnId].displayColumn)
				$scope.displayInfo._.numCols++;

			if ($scope.displayInfo[columnId].displayAddButton)
				$scope.displayInfo._.displayFooterRow = true;
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

		$scope.save = function() {
			pageChangeWatch()
			$scope.currentInput.$save(function() { $state.go('main.project.input.list'); });
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
					$state.go('main.project.input.list');
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
