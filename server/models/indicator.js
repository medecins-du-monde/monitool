"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/indicator'),
	database  = require('../database');

var validate = validator(schema);

var Indicator = module.exports = {
	get: Abstract.get.bind(this, 'indicator'),
	delete: Abstract.delete.bind(this, 'indicator'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		var opt;

		if (options.mode === 'project') {
			if (!options.projectId)
				return callback('missing_parameter')

			// the indicators used by the project + all their dependencies (for the used formulas)
			database.get(options.projectId, function(error, project) {
				if (error)
					return callback('no_such_project');

				var indicatorIds = Object.keys(project.indicators) || [];
				return Abstract.list('indicator', {ids: indicatorIds}, callback);
			});
		}
		else
			return Abstract.list('indicator', options, callback);
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		return callback(null);
	}
	
};
