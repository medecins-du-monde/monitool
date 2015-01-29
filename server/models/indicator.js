"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/indicator'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {
	list: Abstract.list.bind(this, 'indicator'),
	get: Abstract.get.bind(this, 'indicator'),
	delete: Abstract.delete.bind(this, 'indicator'),
	set: Abstract.set.bind(this),

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
