"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	Project   = require('./project'),
	schema    = require('./schemas/input'),
	database  = require('../database');

var validate = validator(schema);

var Input = module.exports = {
	list: Abstract.list.bind(this, 'input'),
	get: Abstract.get.bind(this, 'input'),
	delete: Abstract.delete.bind(this, 'input'),
	set: Abstract.set.bind(this),


	listByProject: function(projectId, options, callback) {
		var queryOpt = {
			startkey: options.begin ? [projectId, options.begin] : [projectId],
			endkey: options.end ? [projectId, options.end] : [projectId, {}],
			include_docs: true
		};

		database.view('reporting', 'inputs_by_project_date', queryOpt, function(error, data) {
			callback(null, data.rows.map(function(row) { return row.doc; }));
		});
	},

	listByProjectSubType: function(projectId, subType, subTypeId, options, callback) {
		if (subType === 'group') {
			// we fetch the project, all project inputs, and filter here.
			// we are overfetching, but that's better than making multiple queries for each entity,
			Project.get(projectId, function(error, project) {
				Input.listByProject(projectId, options, function(error, inputs) {
					var group;
					project.inputGroups.forEach(function(g) { if (g.id === subTypeId) group = g; });

					if (group)
						// filter inputs to keep only those that are in the group
						callback(null, inputs.filter(function(input) {
							return group.members.indexOf(input.entity) !== -1;
						}));
					else
						// we should raise an error: the group does not exists
						callback(null, []);
				});
			});
		}
		else if (subType === 'entity' || subType === 'form') {
			var queryOpt = {
				startkey: options.begin ? [subTypeId, options.begin] : [subTypeId],
				endkey: options.end ? [subTypeId, options.end] : [subTypeId, {}],
				include_docs: true
			};

			database.view('reporting', 'inputs_by_' + subType + '_date', queryOpt, function(error, data) {
				callback(null, data.rows.map(function(row) { return row.doc; }));
			});
		}
	},
};

