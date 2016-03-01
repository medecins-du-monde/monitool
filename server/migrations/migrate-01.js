"use strict";

var nano = require('nano');

var old = nano('http://localhost:5984').use('monitool-prod-backup');
var newDb = nano('http://localhost:5984').use('monitool');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var documentsToKeep = [];

	var id;

	for (id in documents.theme) {
		var theme = documents.theme[id];
		documentsToKeep.push(theme);
	}

	for (id in documents.type) {
		var type = documents.type[id];
		documentsToKeep.push(type);
	}	

	for (id in documents.user) {
		var user = documents.user[id];
		documentsToKeep.push(user);
	}

	for (id in documents.project) {
		var project = documents.project[id];

		delete project._rev;

		// Fix entities
		project.entities.forEach(function(entity) { entity.start = entity.end = null; });

		// Fix users
		project.users = [];
		project.dataEntryOperators.forEach(function(dataEntryOperator) {
			project.users.push({type: 'internal', id: dataEntryOperator, role: "input_all"});
		});

		project.owners.forEach(function(owner) {
			var users = project.users.filter(function(projectUser) { return projectUser.id == owner; });
			if (users.length)
				users[0].role = 'owner';
			else
				project.users.push({type: 'internal', id: owner, role: "owner"});
		});

		delete project.owners;
		delete project.dataEntryOperators;

		// Fix forms
		project.forms.forEach(function(form) {
			if (form.useProjectStart)
				form.start = null;
			
			if (form.useProjectEnd)
				form.end = null;

			if (form.periodicity == 'planned')
				form.periodicity = 'free';
			
			delete form.active;
			delete form.intermediaryDates;
			delete form.useProjectStart;
			delete form.useProjectEnd;

			form.elements = [];
			form.sections.forEach(function(section) {
				form.elements = form.elements.concat(section.elements);
			});
			delete form.sections;
		});

		// Fix logical frame
		var fixIndicator = function(indicatorId) {
			var indicator = documents.indicator[indicatorId],
				planning  = project.indicators[indicatorId];

			var newIndicator = {
				display: indicator.name.fr,
				indicatorId: indicatorId,
				colorize: planning.colorize || false,
				baseline: planning.baseline || null,
				target: planning.target || null,
				unit: indicator.unit == '' ? 'none' : indicator.unit,
				targetType: indicator.target,
				formula: null,
				parameters: {}
			};

			// we leave the filters broken. Fixing by hand is going to be faster.
			if (planning.formula) {
				var formula = indicator.formulas[planning.formula];
				newIndicator.formula = formula.expression;
				for (var key in planning.parameters) {
					newIndicator.parameters[key] = {elementId: planning.parameters[key].variable, filter: {}};
					if (!planning.parameters[key].variable) {
						console.log('invalid complex indicator...');
						return null;
					}
				}
			}
			else if (planning.variable) {
				newIndicator.formula = 'default';
				newIndicator.parameters = {
					'default': {elementId: planning.variable, filter: {}}
				};
			}
			else {
				console.log('invalid simple indicator...');
				newIndicator = null;
			}

			return newIndicator;
		};

		var filterIndicator = function(indicator) {
			return !!indicator;
		};

		// give name to logical frame
		project.logicalFrame.name = "Default";

		// retrieve ids of all ASSIGNED indicators
		var indicatorIds = [];
		indicatorIds = indicatorIds.concat(project.logicalFrame.indicators)
		project.logicalFrame.purposes.forEach(function(purpose) {
			indicatorIds = indicatorIds.concat(purpose.indicators)
			purpose.outputs.forEach(function(output) {
				indicatorIds = indicatorIds.concat(output.indicators)
			});
		});

		// fix all assigned indicators
		project.logicalFrame.indicators = project.logicalFrame.indicators.map(fixIndicator).filter(filterIndicator);
		project.logicalFrame.purposes.forEach(function(purpose) {
			purpose.indicators = purpose.indicators.map(fixIndicator).filter(filterIndicator);
			purpose.outputs.forEach(function(output) {
				output.indicators = output.indicators.map(fixIndicator).filter(filterIndicator);
			});
		});

		// remove all assigned indicators from hash.
		indicatorIds.forEach(function(indicatorId) { delete project.indicators[indicatorId]; });

		// assign logframe to list, and create new logframe for extra indicators if needed
		project.logicalFrames = [project.logicalFrame];
		delete project.logicalFrame;

		if (Object.keys(project.indicators).length)
			project.logicalFrames.push({
				name: "Extra indicators",
				goal: "Extra indicators",
				indicators: Object.keys(project.indicators).map(fixIndicator)
			});

		delete project.indicators;

		documentsToKeep.push(project);
	}

	// fix indicators
	for (id in documents.indicator) {
		var indicator = documents.indicator[id];

		delete indicator._rev;

		delete indicator.target;
		delete indicator.unit;
		delete indicator.formulas;

		documentsToKeep.push(indicator);
	}

	// fix inputs
	for (id in documents.input) {
		var input = documents.input[id];

		delete input._rev;

		var newValues = {};
		for (var key in input.values) {
			var index = key.indexOf('.');
			if (index == -1)
				newValues[key] = {'': input.values[key]};
			else {
				var elementId = key.substring(0, index),
					partitions = key.substring(index + 1);

				if (!newValues[elementId])
					newValues[elementId] = {};
				newValues[elementId][partitions] = input.values[key];
			}
		}
		input.values = newValues;

		documentsToKeep.push(input);
	}

	newDb.bulk({docs: documentsToKeep}, function(error, done) {
		console.log(error);
	});

});

