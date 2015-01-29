"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/indicator'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {
	get: Abstract.get.bind(this, 'indicator'),
	delete: Abstract.delete.bind(this, 'indicator'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'theme_type')
			// the indicators that match a type and theme
			;
		else if (options.mode === 'project_logframe') 
			// only the indicators used by the project
			;
		else if (options.mode === 'project_reporting')
			// the indicators used by the project + all their dependencies (for the used formulas)
			;
		else if (options.mode === 'project_form')
			// the indicators used by the project + all their dependencies (for all formulas)
			;
		else
			return Abstract.list.bind(this, 'indicator', options, callback);
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		// Check dependencies
		var ids = {type: item.types, theme: item.themes, indicator: []};
		for (var formulaId in item.formulas)
			for (var key in item.formulas[formulaId].parameters)
				if (ids.indicator.indexOf(item.formulas[formulaId].parameters[key]) === -1)
					ids.indicator.push(item.formulas[formulaId].parameters[key]);

		Abstract._checkIds(ids, function(errors) {
			return callback(errors.length ? errors : null)
		});
	}
};
