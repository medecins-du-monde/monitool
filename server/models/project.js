"use strict";

var validator = require('is-my-json-valid'),
	async     = require('async'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/project'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {

	get: Abstract.get.bind(this, 'project'),
	delete: Abstract.delete.bind(this, 'project'),

	list: function(options, callback) {
		if (options.mode === 'indicator_reporting')
			database.view('shortlists', 'projects_by_indicator', {key: options.indicatorId, include_docs: true}, function(error, result) {
				callback(null, result.rows.map(function(row) { return row.doc; }));
			});

		else if (options.mode === 'list')
			database.view('shortlists', 'projects_short', {}, function(error, result) {
				callback(null, result.rows.map(function(row) { return row.value; }));
			});

		else
			Abstract.list('project', options, callback);
	},

	set: function(newProject, callback) {
		var removeInputs = function(mode, oldProject, newProject, removeFinishedCallback) {
			var listName = {entity: 'inputEntities', form: 'dataCollection'}[mode];

			var oldForms = oldProject[listName].map(function(f) { return f.id; }),
				newForms = newProject[listName].map(function(f) { return f.id; }),
				removedForms = oldForms.filter(function(id) { return newForms.indexOf(id) === -1; });

			if (!removedForms.length)
				removeFinishedCallback();

			else
				async.map(removedForms, function(formId, cb) {
					var opt = {include_docs: true, startkey: [formId], endkey: [formId, {}]};

					database.view('reporting', 'inputs_by_' + mode + '_date', opt, function(error, result) {
						cb(null, result.rows.map(function(row) { return {_id: row.id, _rev: row.doc._rev, _deleted: true}; }));
					});
				}, function(error, inputs) {
					inputs = Array.prototype.concat.apply([], inputs);
					if (!inputs.length)
						removeFinishedCallback()
					else
						// Assume that the operation goes well
						database.bulk({docs: inputs}, {}, removeFinishedCallback);
				});
		};

		database.get(newProject._id, function(error, oldProject) {
			if (oldProject) {
				removeInputs('entity', oldProject, newProject, function() {
					removeInputs('form', oldProject, newProject, function() {
						Abstract.set(newProject, callback);
					});
				});
			}
			else
				Abstract.set(newProject, callback);
		});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// Check group ids
		var entityIds = item.inputEntities.map(function(e) { return e.id; });
		item.inputGroups.forEach(function(group) {
			group.members.forEach(function(entityId) {
				if (entityIds.indexOf(entityId) === -1)
					errors.push({field: "inputGroups.members", message: entityId + ' is unknown.'});
			});
		});

		return callback(errors.length ? errors : null);
	},

};
