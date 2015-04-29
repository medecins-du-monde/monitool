"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	Project   = require('./project'),
	schema    = require('./schemas/input'),
	database  = require('../database');

var validate = validator(schema);

var Input = module.exports = {
	// list: Abstract.list.bind(this, 'input'),
	get: Abstract.get.bind(this, 'input'),
	delete: Abstract.delete.bind(this, 'input'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		var opt;
		
		if (options.mode === 'project_input_ids') {
			// used for late inputs
			opt = {startkey: [options.projectId], endkey: [options.projectId, {}]};
			database.view('reporting', 'inputs_by_project_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}
		else if (options.mode === 'ids_by_form') {
			opt = {startkey: [options.formId], endkey: [options.formId, {}]};
			database.view('reporting', 'inputs_by_form_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}
		else if (options.mode === 'ids_by_entity') {
			opt = {startkey: [options.entityId], endkey: [options.entityId, {}]};
			database.view('reporting', 'inputs_by_entity_date', opt, function(error, result) {
				if (result && result.rows)
					callback(null, result.rows.map(function(item) { return item.id; }));
				else
					callback(null, []);
			});
		}
		else if (['project_inputs', 'entity_inputs', 'form_inputs'].indexOf(options.mode) !== -1) {
			var filter   = options.mode.replace(/_inputs$/, ''),
				viewName = 'inputs_by_' + filter + '_date',
				param    = filter + 'Id';

			if (!Array.isArray(options[param]))
				options[param] = [options[param]]

			async.map(
				options[param],
				function(curParamId, callback) {
					var opt = {startkey: [curParamId, options.begin || null], endkey: [curParamId, options.end || {}], include_docs: true};

					database.view('reporting', viewName, opt, function(error, result) {
						if (result && result.rows)
							callback(null, result.rows.map(function(item) { return item.doc; }));
						else
							callback(null, []);
					});
				},
				function(error, results) {
					callback(null, Array.prototype.concat.apply([], results));
				}
			);
		}
		else if (options.mode === 'current+last') {
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
		else
			return Abstract.list('input', options, callback)
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		callback(null);
	},

};





