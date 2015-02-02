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
				callback(null, result.rows.map(function(item) { return item.id; }));
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
					var opt = {startkey: [curParamId, options.begin], endkey: [curParamId, options.end], include_docs: true};
					database.view('reporting', viewName, opt, function(error, result) {
						callback(null, result.rows.map(function(item) { return item.doc; }));
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

	// listByProject: function(projectId, options, callback) {
	// 	var queryOpt = {
	// 		startkey: options.begin ? [projectId, options.begin] : [projectId],
	// 		endkey: options.end ? [projectId, options.end] : [projectId, {}],
	// 		include_docs: true
	// 	};

	// 	database.view('reporting', 'inputs_by_project_date', queryOpt, function(error, data) {
	// 		callback(null, data.rows.map(function(row) { return row.doc; }));
	// 	});
	// },

	// listByProjectSubType: function(projectId, subType, subTypeId, options, callback) {
	// 	if (subType === 'group') {
	// 		// we fetch the project, all project inputs, and filter here.
	// 		// we are overfetching, but that's better than making multiple queries for each entity,
	// 		Project.get(projectId, function(error, project) {
	// 			Input.listByProject(projectId, options, function(error, inputs) {
	// 				var group;
	// 				project.inputGroups.forEach(function(g) { if (g.id === subTypeId) group = g; });

	// 				if (group)
	// 					// filter inputs to keep only those that are in the group
	// 					callback(null, inputs.filter(function(input) {
	// 						return group.members.indexOf(input.entity) !== -1;
	// 					}));
	// 				else
	// 					// we should raise an error: the group does not exists
	// 					callback(null, []);
	// 			});
	// 		});
	// 	}
	// 	else if (subType === 'entity' || subType === 'form') {
	// 		var queryOpt = {
	// 			startkey: options.begin ? [subTypeId, options.begin] : [subTypeId],
	// 			endkey: options.end ? [subTypeId, options.end] : [subTypeId, {}],
	// 			include_docs: true
	// 		};

	// 		database.view('reporting', 'inputs_by_' + subType + '_date', queryOpt, function(error, data) {
	// 			callback(null, data.rows.map(function(row) { return row.doc; }));
	// 		});
	// 	}
	// },
};





