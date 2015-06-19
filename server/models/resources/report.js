"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	"$schema": "http://json-schema.org/schema#",
	"title": "Monitool report schema",
	"type": "object"
});

var Report = module.exports = {
	get: Abstract.get.bind(this, 'report'),
	delete: Abstract.delete.bind(this, 'report'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'dates_only')
			database.view('reporting', 'report_by_project', {startkey: [options.projectId, null], endkey: [options.projectId, {}]}, function(error, result) {
				callback(null, result.rows.map(function(row) { return {_id: row.id, date: row.key[1], name: row.value}; }));
			});
		else
			return Abstract.list('report', options, callback)
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		callback(null);
	},

};
