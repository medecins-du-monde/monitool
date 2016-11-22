"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database'),
	schema    = require('./indicator.json');

var validate = validator(schema);

var Indicator = module.exports = {
	get: Abstract.get.bind(this, 'indicator'),

	list: function(options, callback) {
		return Abstract.list('indicator', options, callback);
	},

	set: Abstract.set.bind(this),

	"delete": function(id, callback) {
		var options = {keys: [id], reduce: false, offset: 0, include_docs: true};

		database.view('server', 'reverse_dependencies', options, function(error, result) {
			var projects = result.rows
				.map(function(row) { return row.doc; })
				.filter(function(p) { return p.crossCutting[id]; });

			projects.forEach(function(project) { delete project.crossCutting[id]; });

			// save them all
			database.bulk({docs: projects}, function() {
				// delete indicator
				Abstract.delete('indicator', id, callback);
			});
		});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		return callback(null);
	}
	
};
