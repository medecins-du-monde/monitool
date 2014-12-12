"use strict";

var annotateFormElement = function(formElement, currentPath, indicatorsById) {
	var indicator = indicatorsById[formElement.id];
	formElement.name = indicator.name;
	formElement.path = currentPath;
	formElement.availableTypes = [{value: 'input', label: 'Input', group: null}]; // input is always allowed

	for (var formulaId in indicator.formulas) {
		var formula = indicator.formulas[formulaId];

		// Add each formula to the element
		formElement.availableTypes.push({value: 'compute:' + formulaId, label: formula.name, group: "compute"});

		// if the element is computed, annotate it's sons with the relevant formula and traverse them!
		if (formElement.type === 'compute:' + formulaId)
			for (var key in formula.parameters) {
				formElement.parameters[key].id = indicator.formulas[formulaId].parameters[key];
				annotateFormElement(formElement.parameters[key], currentPath + '.' + key, indicatorsById);
			}
	}
};

var flatten = function(formElement) {
	var result = [formElement];
	for (var key in formElement.parameters)
		result = result.concat(flatten(formElement.parameters[key]))
	return result;
};

var buildLinks = function(formElements, indicatorsById) {
	// flatten all form elements in an array to iterate it with native methods
	var flatFormElements = [];
	formElements.forEach(function(formElement) {
		flatFormElements = flatFormElements.concat(flatten(formElement));
	});
	
	// we need to add all valid links now.
	flatFormElements.forEach(function(changingFormElement) {
		// Remove previously build links.
		changingFormElement.availableTypes = changingFormElement.availableTypes.filter(function(type) {
			return type.value.substring(0, "link".length) !== 'link';
		});

		// Search for all possible links, in O(n), because we're lazy.
		flatFormElements.forEach(function(linkFormElement) {
			if (changingFormElement.id === linkFormElement.id
				&& changingFormElement.path !== linkFormElement.path 
				&& linkFormElement.type.substring(0, "link".length) !== 'link') {

				var name = indicatorsById[linkFormElement.path.split('.')[0]].name;

				changingFormElement.availableTypes.push({
					value: 'link:' + linkFormElement.path,
					label: name + ' > ' + linkFormElement.path.split('.').slice(1).join(' > '),
					group: 'Lien'
				});
			}
		});
	});
};




angular.module('monitool.controllers.project', [])

	.controller('ProjectListController', function($scope, projects) {
		$scope.projects       = projects;
		$scope.filterFinished = true;
		$scope.now            = moment().format('YYYY-MM');
		$scope.pred           = 'name'; // default sorting predicate

		$scope.isDisplayed = function(project) {
			return $scope.showFinished || project.end > $scope.now;
		};
	})

	.controller('ProjectMenuController', function($scope, $state, $stateParams, project, mtDatabase) {
		if ($stateParams.projectId === 'new')
			project.owners.push($scope.userCtx.name);

		$scope.project = project;
		$scope.master = angular.copy(project);

		// save, reset and isUnchanged are all defined here, because those are shared between all project views.
		$scope.save = function() {
			if ($stateParams.projectId === 'new')
				$scope.project._id = PouchDB.utils.uuid().toLowerCase();

			mtDatabase.current.put($scope.project).then(function(result) {
				$scope.project._rev = result.rev;
				$scope.master = angular.copy($scope.project);

				if ($stateParams.projectId === 'new')
					$state.go('main.project.logical_frame', {projectId: result.id});
			}).catch(function(error) {
				$scope.error = error;
			});
		};

		$scope.reset = function() {
			$scope.project = angular.copy($scope.master);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.master, $scope.project);
		};

		// We restore $scope.master on $scope.project to avoid unsaved changes from a given tab to pollute changes to another one.
		$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
			var pages = ['main.project.logical_frame', 'main.project.input_entities', 'main.project.input_groups', 'main.project.user_list'];

			// if unsaved changes were made
			if (pages.indexOf(fromState.name) !== -1 && !angular.equals($scope.master, $scope.project)) {
				// then ask the user if he meant it
				if (window.confirm('Vous avez réalisé des modifications. Êtes-vous sûr de vouloir changer de page sans sauvegarder?'))
					$scope.reset();
				else
					event.preventDefault();
			}
		});
	})

	.controller('ProjectLogicalFrameController', function($scope, $state, $q, $modal, indicatorsById) {
		// contains description of indicators for the loaded project.
		$scope.indicatorsById = indicatorsById;

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

		// handle indicator add, edit and remove are handled in a modal window.
		$scope.editIndicator = function(indicatorId, target) {
			var indicatorIdPromise;
			if (indicatorId === 'new')
				indicatorIdPromise = $modal.open({
					templateUrl: 'partials/indicators/selector-popup.html',
					controller: 'IndicatorChooseController',
					size: 'lg',
					resolve: {
						forbiddenIds: function() { return target ? $scope.getAssignedIndicators() : Object.keys($scope.project.indicators); }
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
						templateUrl: 'partials/projects/logical-frame-indicator.html',
						controller: 'ProjectLogicalFrameIndicatorController',
						size: 'lg',
						scope: $scope, // give our $scope to give it access to userCtx, project and indicatorsById.
						resolve: {indicatorId: function() { return chosenIndicatorId; }, target: function() { return target; }}
					});
			});
		};

		$scope.detachIndicator = function(indicatorId, target) {
			target.splice(target.indexOf(indicatorId), 1);
		};

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
			output.activities.push({description: "", prerequisites: ""});
		};

		$scope.removeActivity = function(activity, output) {
			output.activities.splice(output.activities.indexOf(activity), 1);
		};

		$scope.$watch('project', function(project) {
			$scope.otherIndicators = Object.keys($scope.project.indicators);
			$scope.getAssignedIndicators().forEach(function(indicatorId) {
				if ($scope.otherIndicators.indexOf(indicatorId) !== -1)
					$scope.otherIndicators.splice($scope.otherIndicators.indexOf(indicatorId), 1);
			});
		}, true);
	})

	/**
	 * This controller is a modal and DOES NOT inherit from ProjectLogicalFrameController
	 * Hence the need for project and userCtx to be passed explicitly.
	 */
	.controller('ProjectLogicalFrameIndicatorController', function($scope, $modalInstance, mtDatabase, indicatorId, target) {
		// Retrieve indicator array where we need to add or remove indicator ids.
		$scope.isNew = !$scope.project.indicators[indicatorId];
		$scope.planning = angular.copy($scope.project.indicators[indicatorId]) || {
			relevance: '', baseline: 0,
			minimum: 0, orangeMinimum: 20, greenMinimum: 40,
			greenMaximum: 60, orangeMaximum: 80, maximum: 100,
			targets: []
		};

		// FIXME, this query is useless, we could avoid it and pass the full indicator from the calling controller.
		mtDatabase.current.get(indicatorId).then(function(indicator) {
			$scope.indicator = indicator;
		});

		$scope.addTarget = function() {
			$scope.planning.targets.push({period: null, value: 0});
		};

		$scope.removeTarget = function(target) {
			$scope.planning.targets.splice($scope.planning.targets.indexOf(target), 1);
		};

		$scope.isUnchanged = function() {
			return angular.equals($scope.planning, $scope.project.indicators[indicatorId]);
		};

		$scope.save = function() {
			if ($scope.isNew)
				target && target.push(indicatorId);

			$scope.project.indicators[indicatorId] = $scope.planning;
			$scope.indicatorsById[indicatorId] = $scope.indicator; // inject the indicator in the parent scope.
			$modalInstance.close();
		};

		$scope.delete = function() {
			target && target.splice(target.indexOf(indicatorId), 1);
			delete $scope.project.indicators[indicatorId];
			$modalInstance.close();
		};

		$scope.cancel = function() {
			$modalInstance.close();
		};
	})

	.controller('ProjectInputEntitiesController', function($scope, project, mtDatabase) {
		$scope.create = function() {
			$scope.project.inputEntities.push({id: PouchDB.utils.uuid().toLowerCase(), name: ''});
		};

		$scope.delete = function(inputEntityId) {
			var message = 'Si vous supprimez un lieu d\'activité vous perdrez toutes les saisies associées. Tapez "supprimer" pour confirmer';

			if (prompt(message) == 'supprimer') {
				$scope.project.inputEntities = 
					$scope.project.inputEntities.filter(function(entity) { return entity.id !== inputEntityId; });
			}
		};
	})

	.controller('ProjectInputGroupsController', function($scope, project, mtDatabase) {
		$scope.create = function() {
			$scope.project.inputGroups.push({id: PouchDB.utils.uuid().toLowerCase(), name: '', members: []});
		};

		$scope.delete = function(inputEntityId) {
			$scope.project.inputGroups = 
				$scope.project.inputGroups.filter(function(entity) { return entity.id !== inputEntityId; });
		};
	})

	.controller('ProjectFormsController', function($scope, project) {
		$scope.noFormsYet = Object.keys(project.dataCollection).length === 0;
	})

	.controller('ProjectFormEditionController', function($scope, $state, $stateParams, mtDatabase, form, indicatorsById, formulasById) {
		$scope.form = form;
		$scope.indicatorsById = indicatorsById;
		$scope.availableIndicators = [];
		$scope.container = { chosenIndicators: [] };

		if ($stateParams.formId === 'new')
			$scope.project.dataCollection.push($scope.form);

		// There might be some magic here
		// Should this watch be executed also when editing scope.form.fields?
		$scope.$watch(['form.useProjectStart', 'form.start', 'form.useProjectEnd', 'form.end'], function(newValue) {
			// FIXME WE SHOULD PROMPT THE USER BEFORE CHANGING THE LIST OF INDICATORS.

			// when begin and end change, we need to update the list of available indicators.
			// the user cannot choose an indicator which is already collected in the same period.
			$scope.availableIndicators = Object.keys($scope.project.indicators)
				// .filter(function(indicatorId) { return true; })
				.map(function(indicatorId) { return indicatorsById[indicatorId]; });

			// Remove those indicators from the list of chosen ones.
			$scope.container.chosenIndicatorIds = $scope.form.fields
				.map(function(field) { return field.id; })
				.filter(function(indicatorId) {
					return !!$scope.availableIndicators.filter(function(indicator) { return indicator._id == indicatorId; }).length;
				});
		});

		// the db version it DRY, and a lot of information is missing for use to display it properly.
		// We make a copy and annotate it, adding all the data we need
		$scope.formElements = angular.copy($scope.form.fields);
		$scope.formElements.forEach(function(formElement) {
			annotateFormElement(formElement, formElement.id, indicatorsById);
		});
		buildLinks($scope.formElements, indicatorsById);

		var deleteFormElement = function(formElements, formElement) {

		};

		// now that's done, we "only" need to monitor changes on the types selects.
		$scope.sourceChanged = function(indicator) {
			if (indicator.type === 'input' || indicator.type.substring(0, 'link:'.length) === 'link:')
				// that's easy, only delete parameters *cleanly*
				delete indicator.parameters;
			else {
				var formula = formulasById[indicator.type.substring('compute:'.length)];
				indicator.parameters = {};
				for (var key in formula.parameters) {
					indicator.parameters[key] = {id: formula.parameters[key], type: "input", source: ''};
					annotateFormElement(indicator.parameters[key], indicator.path + '.' + key, indicatorsById);
				}
			}

			buildLinks($scope.formElements, indicatorsById);
		};






		// $scope.formElements = [
		// 	{
		// 		id: "97ab3f8e-cdc4-44be-baee-1c8ab7255c07",
		// 		name: "Nom de l'indicateur",
		// 		source: "sdfjskldf",
		// 		type: "compute:738efc88-7c00-4ce4-b451-5cfccd0130ea",
		// 		availableTypes: [
		// 			{value: 'input', label: 'Input', group: null},
		// 			{value: 'link:6b533df6-a3e7-486c-b786-99031480c6d0', label: 'another indicator name', group: "link"},
		// 			{value: 'link:f435209b-778d-480c-ae24-47594d1e1cee', label: 'another indicator name 2', group: "link"},
		// 			{value: 'compute:738efc88-7c00-4ce4-b451-5cfccd0130ea', label: "formula name", group: "formula"}
		// 		],
		// 		parameters: {
		// 			a: {
		// 				id: "e0e0a1dd-e4bf-402f-b605-35c11716b4a9",
		// 				name: "{indicatorName 1}",
		// 				source: "sdfjskldf",
		// 				type: "input",
		// 				availableTypes: [
		// 					{value: 'input', label: 'Input', group: null},
		// 					{value: 'link:6b533df6-a3e7-486c-b786-99031480c6d0', label: 'another indicator name', group: "link"},
		// 					{value: 'link:f435209b-778d-480c-ae24-47594d1e1cee', label: 'another indicator name 2', group: "link"},
		// 					{value: 'compute:738efc88-7c00-4ce4-b451-5cfccd0130ea', label: "formula name", group: "formula"}
		// 				],
		// 			},
		// 			b: {
		// 				id: "320895ac-bf08-44de-989f-f4040ff27867",
		// 				name: "{indicatorName 2}",
		// 				source: "sdfjskldf",
		// 				type: "input",
		// 				availableTypes: [
		// 					{value: 'input', label: 'Input', group: null},
		// 					{value: 'link:6b533df6-a3e7-486c-b786-99031480c6d0', label: 'another indicator name', group: "link"},
		// 					{value: 'link:f435209b-778d-480c-ae24-47594d1e1cee', label: 'another indicator name 2', group: "link"},
		// 					{value: 'compute:738efc88-7c00-4ce4-b451-5cfccd0130ea', label: "formula name", group: "formula"}
		// 				],
		// 			}
		// 		}
		// 	}
		// ];



		// when chosenIndicators changes, we need to udate the form's fields
		// $scope.$watchCollection('container.chosenIndicatorIds', function(newValue, oldValue) {
		// 	var added   = newValue.filter(function(i) { return oldValue.indexOf(i) === -1; }),
		// 		removed = oldValue.filter(function(i) { return newValue.indexOf(i) === -1; });

		// 	// Adding indicators means we need to add a manual input
		// 	added.forEach(function(indicatorId) {
		// 		$scope.form.fields.push({id: indicatorId, type: 'input'});
		// 	});

		// 	// Removing indicators means we need to
		// 	// - delete the entry in the tree.
		// 	// - promote the first link to it to whatever it is supposed to be really.
		// 	// - change all links in the rest of the tree.
		// 	removed.forEach(function(indicatorId) {
		// 		// we know the indicator is present in the array => this ain't an infinite loop
		// 		for (var i = 0; i < $scope.form.fields[i].id !== indicatorId; ++i)
		// 			continue;

		// 		var entry = $scope.form.fields.splice(i, 1)[0];
		// 		throw new Error('not yet implemented');
		// 	});
		// });

		// $scope.$watch('form.fields', function(newValue) {
		// 	var annotate = function(subForm) {
		// 		// On a toujours le droit de saisir une feuille a la main
		// 		subForm.available = [{value: "input", label: "Input"}];
		// 		// Etablir la liste des formules de calcul.
		// 		// Faire la recherche de tous les autres indicateurs qui sont en input ou computed pour les liens
		// 	};
		// }, true)


		// // There might be some magic here
		// // Should this watch be executed also when editing scope.form.fields?
		// $scope.$watch(['form.useProjectStart', 'form.start', 'form.useProjectEnd', 'form.end'], function(newValue) {
		// 	// when begin and end change, we need to update the list of available indicators.
		// 	// the user cannot choose an indicator which is already collected in the same period.
		// 	$scope.availableIndicators = Object.keys($scope.project.indicators)
		// 		// .filter(function(indicatorId) { return true; })
		// 		.map(function(indicatorId) { return indicatorsById[indicatorId]; });

		// 	// Remove those indicators from the list of chosen ones.
		// 	$scope.container.chosenIndicatorIds = Object.keys($scope.form.fields).filter(function(indicatorId) {
		// 		return !!$scope.availableIndicators.filter(function(indicator) {
		// 			return indicator._id == indicatorId;
		// 		}).length;
		// 	});
		// });


		// // when chosenIndicators changes, we need to udate the form's fields
		// $scope.$watchCollection('container.chosenIndicatorIds', function(newValue) {
		// 	// Remove from form.fields all indicators that are not relevant, and add missing ones.
		// 	var indicatorId,
		// 		relevantIndicatorIds  = angular.copy($scope.container.chosenIndicatorIds),
		// 		numRelevantIndicators = relevantIndicatorIds.length;

		// 	for (var i = 0; i < numRelevantIndicators; ++i) {
		// 		indicatorId = relevantIndicatorIds[i];
				
		// 		// add missing indicator
		// 		if (!$scope.form.fields[indicatorId])
		// 			$scope.form.fields[indicatorId] = {type: "manual", source: ""};

		// 		// queue new relevant indicators that we need to check if they are not already present.
		// 		else if ($scope.form.fields[indicatorId].type === 'computed')
		// 			for (var key in $scope.form.fields[indicatorId].parameters)
		// 				if (relevantIndicatorIds.indexOf($scope.form.fields[indicatorId].parameters[key]) === -1) {
		// 					relevantIndicatorIds.push($scope.form.fields[indicatorId].parameters[key]);
		// 					++numRelevantIndicators;
		// 				}
		// 	}

		// 	for (indicatorId in $scope.form.fields)
		// 		if (relevantIndicatorIds.indexOf(indicatorId) === -1)
		// 			delete $scope.form.fields[indicatorId];
		// });





		// Build indicator selection
		// var rebuildChosenIndicators = function() {
		// 	$scope.chosenIndicators = [];
		// 	Object.keys($scope.project.indicators).forEach(function(indicatorId) {
		// 		if ($scope.form.fields[indicatorId])
		// 			$scope.chosenIndicators.push({id: indicatorId, selected: true, disabled: false});
		// 		else {
		// 			var disabled = false;
		// 			$scope.project.dataCollection.forEach(function(form) {
		// 				if (form.id !== $scope.form.id && form.fields[indicatorId])
		// 					disabled = true;
		// 			});
		// 			$scope.chosenIndicators.push({id: indicatorId, selected: false, disabled: disabled});
		// 		}
		// 	});
		// };


		// $scope.updateFields = function() {
		// 	// Retrieve all dependencies of a given indicator, with duplicates (which we do not care about).
		// 	var getDependenciesRec = function(indicatorId) {
		// 		var list  = [indicatorId],
		// 			field = $scope.form.fields[indicatorId];
		// 		if (field.type === 'computed')
		// 			for (var key in field.parameters)
		// 				list = getDependenciesRec(field.parameters[key]).concat(list);
		// 		return list;
		// 	};


		// 	var chosenIndicatorIds = $scope.chosenIndicators.filter(function(i) { return i.selected; }).map(function(i) { return i.id; });
		// 	var usedIndicators = [];


		// 	chosenIndicatorIds.forEach(function(indicatorId) {
		// 		// if a new indicator was added in the list, add it to fields
		// 		if (!$scope.form.fields[indicatorId])
		// 			$scope.form.fields[indicatorId] = {type: 'manual'};

		// 		// traverse dependency tree to remove redundant indicators
		// 		usedIndicators = getDependenciesRec(indicatorId).concat(usedIndicators);
		// 	});


		// 	// remove redundant
		// 	Object.keys($scope.form.fields).forEach(function(indicatorId) {
		// 		if (usedIndicators.indexOf(indicatorId) === -1)
		// 			delete $scope.form.fields[indicatorId];
		// 	});
		// };


		// $scope.useFormula = function(indicatorId, formulaId) {
		// 	var field   = $scope.form.fields[indicatorId],
		// 		formula = $scope.indicatorsById[indicatorId].formulas[formulaId];

		// 	field.type = 'computed';
		// 	field.expression = formula.expression;
		// 	field.parameters = formula.parameters;

		// 	var toLoad = [];
		// 	for (var parameterName in field.parameters) {
		// 		var indicatorId = field.parameters[parameterName];
		// 		if (!$scope.form.fields[indicatorId]) {
		// 			$scope.form.fields[indicatorId] = {type: 'manual'};
		// 			toLoad.push(indicatorId);
		// 		}
		// 	}
		// 	mtDatabase.current.allDocs({include_docs: true, keys: toLoad}).then(function(result) {
		// 		result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
		// 	});
		// };


		// $scope.reset = function() {
		// 	$scope.project = angular.copy($scope.master);
			
		// 	if ($stateParams.formId === 'new') {
		// 		$scope.form = {
		// 			id: PouchDB.utils.uuid().toLowerCase(),
		// 			name: "",
		// 			periodicity: "monthly",
		// 			useProjectStart: true,
		// 			useProjectEnd: true,
		// 			fields: {}
		// 		};
		// 		$scope.project.dataCollection.push($scope.form);
		// 	}
		// 	else
		// 		$scope.form = $scope.project.dataCollection.filter(function(form) {
		// 			return form.id == $stateParams.formId;
		// 		})[0];

		// 	rebuildChosenIndicators();
		// };

		// $scope.reset();
	})

	.controller('ProjectInputListController', function($scope, project, inputs) {
		$scope.inputs = inputs;
	})

	.controller('ProjectInputController', function($state, $stateParams, $scope, mtDatabase, mtReporting, project, inputs) {
		$scope.input         = inputs.current;
		$scope.previousInput = inputs.previous;

		$scope.form          = $scope.project.dataCollection.filter(function(form) { return form.id == $stateParams.formId; })[0];
		$scope.inputEntity   = project.inputEntities.filter(function(entity) { return entity.id == $scope.input.entity; })[0];

		var colors = ['#FBB735', '#E98931', '#EB403B', '#B32E37', '#6C2A6A', '#5C4399', '#274389', '#1F5EA8', '#227FB0', '#2AB0C5', '#39C0B3'],
			curColorIndex = 0;

		$scope.colors = colors;

		var fields = [];
		for (var indicatorId in $scope.form.fields) {
			var field = $scope.form.fields[indicatorId];
			field.id = indicatorId;
			field.colors = [];
			if (project.indicators[indicatorId])
				field.colors.push(colors[(curColorIndex++) % colors.length]);
			fields.push(field);
		}

		for (var i = 0; i < 3; ++i)
			fields.forEach(function(field) {
				if (field.type !== 'computed')
					return;
				// retrieve all dependencies and add them all colors from the computed field.
				fields
					.filter(function(f) {
						for (var k in field.parameters)
							if (field.parameters[k] === f.id)
								return true;
						return false;
					})
					.forEach(function(f) {
						field.colors.forEach(function(color) {
							if (f.colors.indexOf(color) === -1)
								f.colors.push(color);
						});
					});
			});

		// sort colors in fields
		fields.forEach(function(field) {
			field.colors.sort(function(color1, color2) {
				return colors.indexOf(color1) - colors.indexOf(color2);
			});
		});


		// sort fields by colors
		fields.sort(function(field1, field2) {
			if (field1.type !== field2.type)
				return field1.type === 'computed' ? -1 : 1;
			 
			var length = Math.min(field1.colors.length, field2.colors.length);
			for (var i = 0; i < length; ++i) {
				var indexA = colors.indexOf(field1.colors[i]),
					indexB = colors.indexOf(field2.colors[i]);
				if (indexA != indexB)
					return indexA - indexB;
			}
			
			return field2.length - field1.length; // longer table goes last.
		});

		$scope.fields = fields;
		$scope.indicatorsById = {};
		mtDatabase.current.allDocs({include_docs: true, keys: Object.keys($scope.form.fields)}).then(function(result) {
			result.rows.forEach(function(row) { $scope.indicatorsById[row.id] = row.doc; });
		});

		$scope.evaluate = function() {
			mtReporting.evaluateScope($scope.form, $scope.input.indicators);
		};

		$scope.copy = function(fieldId) {
			$scope.input.indicators[fieldId] = $scope.previousInput.indicators[fieldId];
			$scope.evaluate();
		};

		$scope.save = function() {
			mtDatabase.current.put($scope.input).then(function() {
				$state.go('main.project.input_list');
			});
		};
	})

	.controller('ProjectReportingController', function($scope, $stateParams, mtReporting, type, project, indicatorsById) {
		var chart = c3.generate({bindto: '#chart', data: {x: 'x', columns: []}, axis: {x: {type: "category"}}});

		$scope.indicatorsById = indicatorsById;
		$scope.begin          = moment().subtract(1, 'year').format('YYYY-MM');
		$scope.end            = moment().format('YYYY-MM');
		$scope.groupBy        = 'month';
		$scope.display        = 'value';
		$scope.plots          = {};

		if ($scope.begin < $scope.project.begin)
			$scope.begin = $scope.project.begin;

		if ($scope.end > moment().format('YYYY-MM'))
			$scope.end = moment().format('YYYY-MM');

		// Retrieve inputs
		$scope.updateData = function() {
			$scope.entity = $scope.group = null;

			var data;
			if (type === 'project')
				data = mtReporting.getProjectStats($scope.project, $scope.begin, $scope.end, $scope.groupBy);
			else if (type === 'entity') {
				data = mtReporting.getEntityStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.entityId);
				$scope.entity = $scope.project.inputEntities.filter(function(e) { return e.id == $stateParams.entityId; })[0];
			}
			else if (type === 'group') {
				data = mtReporting.getGroupStats($scope.project, $scope.begin, $scope.end, $scope.groupBy, $stateParams.groupId);
				$scope.group = $scope.project.inputGroups.filter(function(g) { return g.id == $stateParams.groupId; })[0];
			}

			$scope.cols = mtReporting.getStatsColumns($scope.project, $scope.begin, $scope.end, $scope.groupBy, type, $stateParams[type=='group'?'groupId':'entityId']);
			data.then(function(data) {
				$scope.data = data;

				if ($scope.plot)
					$scope.updateGraph();
			});
		};

		$scope.updateGraph = function(changedIndicatorId) {
			var cols      = $scope.cols.filter(function(e) { return e.id != 'total' }).map(function(e) { return e.name; }),
				chartData = {
					type: $scope.groupBy === 'month' || $scope.groupBy === 'year' ? 'line' : 'bar',
					columns: [['x'].concat(cols)] // x-axis
				};

			if (changedIndicatorId && !$scope.plots[changedIndicatorId])
				chartData.unload = [$scope.indicatorsById[changedIndicatorId].name];

			for (var indicatorId in $scope.plots) {
				if ($scope.plots[indicatorId]) {
					// Retrieve name
					var column = [$scope.indicatorsById[indicatorId].name];

					// iterate on months, centers, etc
					$scope.cols.forEach(function(col) {
						if (col.id !== 'total') {
							if ($scope.data[col.id] && $scope.data[col.id][indicatorId])
								column.push($scope.data[col.id][indicatorId][$scope.display] || 0);
							else
								column.push(0);
						}
					});

					chartData.columns.push(column);
				}
			}

			chart.load(chartData);
		};

		$scope.downloadGraph = function() {
			var filename  = [$scope.project.name, $scope.begin, $scope.end].join('_') + '.png',
				sourceSVG = document.querySelector("svg");

			saveSvgAsPng(sourceSVG, filename, 1);
		};

		$scope.downloadCSV = function() {
			var csvDump = mtReporting.exportProjectStats($scope.cols, $scope.project, $scope.indicatorsById, $scope.data),
				blob    = new Blob([csvDump], {type: "text/csv;charset=utf-8"}),
				name    = [$scope.project.name, $scope.begin, $scope.end].join('_') + '.csv';

			saveAs(blob, name);
		};

		$scope.updateData();
	})

	.controller('ProjectUserListController', function($scope, mtDatabase, project, users) {
		$scope.users = users;
	});
