"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/project'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {

	get: Abstract.get.bind(this, 'project'),
	delete: Abstract.delete.bind(this, 'project'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'indicator_reporting')
			database.view('shortlists', 'projects_by_indicator', {key: options.indicatorId, include_docs: true}, function(error, result) {
				callback(null, result.rows.map(function(row) { return row.doc; }));
			});
		
		else
			Abstract.list('project', options, callback);
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
