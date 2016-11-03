"use strict";


function fixIndicator(indicator) {
	indicator.computation = {formula: indicator.formula, parameters: indicator.parameters};

	delete indicator.targetType;
	delete indicator.unit;
	delete indicator.indicatorId;
	delete indicator.formula;
	delete indicator.parameters;
}




var nano = require('nano');
var old = nano('http://localhost:5984').use('monitool');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	for (id in documents.user) {
		var user = documents.user[id];
		
		// roles are not a single field
		if (user.roles.indexOf('_admin') !== -1)
			user.role = 'admin';
		else if (user.roles.indexOf('project') !== -1)
			user.role = 'project';
		else
			user.role = 'common';

		delete user.roles;

		docsToUpdate.push(user);
	}

	for (id in documents.indicator) {
		var indicator = documents.indicator[id];

		// description is old comments.
		indicator.description = indicator.comments;

		// delete all the rest.
		delete indicator.standard;
		delete indicator.sources;
		delete indicator.comments;
		delete indicator.operation;
		delete indicator.types;

		docsToUpdate.push(indicator);
	}

	for (id in documents.project) {
		var project = documents.project[id];

		// Remove activities, fix indicators
		project.logicalFrames.forEach(function(logicalFrame) {
			logicalFrame.indicators.forEach(fixIndicator);
			logicalFrame.purposes.forEach(function(purpose) {
				purpose.indicators.forEach(fixIndicator);
				purpose.outputs.forEach(function(output) {
					output.indicators.forEach(fixIndicator);
					delete output.activities;
				});
			});
		});

		// Add order and distribution to form elements
		project.forms.forEach(function(form) {
			form.elements.forEach(function(element) {
				element.distribution = element.order = 0;
			});
		});

		// Add cross-cutting indicators
		project.crossCutting = {};

		docsToUpdate.push(project);
	}

	for (var id in documents.type) {
		var type = documents.type[id];

		// Delete all types.
		docsToUpdate.push({_id: type._id, _rev: type._rev, _deleted: true});
	}

	for (var id in documents.input) {
		var input = documents.input[id];

		try {
			var project = documents.project[input.project],
				form    = project.forms.find(function(form) { return form.id === input.form; });

			if ([/*'week', */'month', 'quarter', 'year'].indexOf(form.periodicity) !== -1) {

				// Update input period.
				if (form.periodicity === 'week')
					// input.period = 
					continue;

				else if (form.periodicity === 'month')
					input.period = input.period.slice(0, 7);

				else if (form.periodicity === 'quarter')
					input.period = input.period.slice(0, 4) + '-Q' + (((input.period.slice(5, 7) - 1) / 3) + 1);

				else if (form.periodicity === 'year')
					input.period = input.period.slice(0, 4);

				// Delete input.
				docsToUpdate.push({_id: input._id, _rev: input._rev, _deleted: true});

				// Update id
				input._id = [input.project, input.entity, input.form, input.period].join(':');
				delete input._rev;

				// recreate input.
				docsToUpdate.push(input);
			}
		}
		catch (e) {
			console.log('invalid input', id, e);
			docsToUpdate.push({_id: input._id, _rev: input._rev, _deleted: true});
		}
	}

	// console.log(JSON.stringify(docsToUpdate));

	old.bulk({docs: docsToUpdate}, function(error, done) {
		console.log(error);
	});

});


