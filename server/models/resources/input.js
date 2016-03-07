"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Project   = require('./project'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	$schema: "http://json-schema.org/schema#",
	title: "Monitool input schema",
	type: "object",
	additionalProperties: false,
	required: ["_id", "type", "project", "entity", "form", "period", "values"],
	
	properties: {
		_id:     {
			type: "string",
			pattern: "^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}:(([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})|none):[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}:\\d{4}-\\d{2}-\\d{2}$"
		},
		_rev:    { "$ref": "#/definitions/revision" },
		type:    { "type": "string", "pattern": "^input$" },
		project: { "$ref": "#/definitions/uuid" },
		entity:  {
			type: "string",
			pattern: "^([a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12})|none$"
		},
		form:    { "$ref": "#/definitions/uuid" },
		period:  { "type": "string", "format": "date" },
		values: {
			type: "object",
			additionalProperties: false,
			patternProperties: {
				"[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}": {
					type: "array",
					items: { type: "number" },
					minItems: 1
				}
			}
		}
	},

	definitions: {
		uuid: {
			type: "string",
			pattern: "^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$"
		},
		revision: {
			type: "string",
			pattern: "^[0-9]+\\-[0-9a-f]{32}$"
		}
	}
});

var Input = module.exports = {

	get: Abstract.get.bind(this, 'input'),
	delete: Abstract.delete.bind(this, 'input'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		var opt;

		// all inputs ids from a project => list inputs done/not done.
		if (options.mode === 'project_input_ids') {
			if (options.restrictProjectId && options.restrictProjectId !== options.projectId)
				return callback(null, []);

			// used for late inputs
			opt = {startkey: [options.projectId, options.start || null], endkey: [options.projectId, options.end || {}]};
			database.view('reporting', 'inputs_by_project_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}

		// delete form => "does this form has inputs?"
		else if (options.mode === 'ids_by_form') {
			if (options.restrictProjectId && options.restrictProjectId !== options.projectId)
				return callback(null, []);
			
			opt = {startkey: [options.projectId, options.formId], endkey: [options.projectId, options.formId, {}]};
			database.view('reporting', 'inputs_by_project_form_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}

		// delete entities => "does this entity has inputs?"
		else if (options.mode === 'ids_by_entity') {
			if (options.restrictProjectId && options.restrictProjectId !== options.projectId)
				return callback(null, []);
			
			opt = {startkey: [options.projectId, options.entityId], endkey: [options.projectId, options.entityId, {}]};
			database.view('reporting', 'inputs_by_project_entity_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}

		// all inputs by project => reporting
		else if (options.mode == 'project_inputs') {
			if (options.restrictProjectId && options.restrictProjectId !== options.projectId)
				return callback(null, []);
			
			opt = {startkey: [options.projectId, options.start || null], endkey: [options.projectId, options.end || {}], include_docs: true};
			database.view('reporting', 'inputs_by_project_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.doc; }));
				else
					callback(null, []);
			});
		}

		// input => retrieve current and last input.
		else if (options.mode === 'current+last') {
			if (options.restrictProjectId && options.restrictProjectId !== options.projectId)
				return callback(null, []);
			
			var id       = [options.projectId, options.entityId, options.formId, options.period].join(':'),
				startKey = id,
				endKey   = [options.projectId, options.entityId, options.formId].join(':'),
				options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true};

			return database.list(options, function(error, result) {
				// retrieve current and previous from view result.
				var current = null, previous = null;

				if (result.rows.length === 1) {
					if (result.rows[0].id !== id) // we only got an old input
						previous = result.rows[0].doc;
					else // we only got the current input
						current = result.rows[0].doc;
				}
				else if (result.rows.length === 2) {
					if (result.rows[0].id !== id) // we got two old inputs
						previous = result.rows[0].doc;
					else // we got the current and previous inputs
						current = result.rows[0].doc;
						previous = result.rows[1].doc;
				}

				callback(null, [current, previous].filter(function(input) { return input; }));
			});
		}

		// default.
		else {
			if (options.restrictProjectId) {
				opt = {startkey: [options.restrictProjectId, options.start || null], endkey: [options.restrictProjectId, options.end || {}], include_docs: true};

				database.view('reporting', 'inputs_by_project_date', opt, function(error, result) {
					if (result && result.rows)
						callback(null, result.rows.map(function(item) { return item.doc; }));
					else
						callback(null, []);
				});
			}
			else {
				return Abstract.list('input', options, callback)
			}
		}
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];

		var id = item._id.split(":");
		id.length != 4 && errors.push('bad_id_length');
		id[0] != item.project && errors.push('project_not_in_id');
		id[1] != item.entity  && errors.push('entity_not_in_id');
		id[2] != item.form    && errors.push('form_not_in_id');
		id[3] != item.period  && errors.push('period_not_in_id');
		if (errors.length)
			return callback(errors);

		callback(null);
	},

};





