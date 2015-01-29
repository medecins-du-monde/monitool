"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/type'),
	database  = require('../database');

var validate = validator(schema);

var Type = module.exports = {
	get: Abstract.get.bind(this, 'type'),
	delete: Abstract.delete.bind(this, 'type'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (mode === 'theme_usage')
			;
		
		else
			database.view('shortlists', 'by_type', {include_docs: true, key: 'type'}, function(error, data) {
				var types = data.rows.map(function(row) { return row.doc; });
				if (!options.with_counts)
					return callback(null, types);

				database.view('server', 'types_usage', {group: true}, function(error, data) {
					var countByType = {};
					data.rows.forEach(function(row) { countByType[row.key] = row.value; });
					types.forEach(function(type) { type.__usage = countByType[type._id] || 0; });

					return callback(null, types);
				});
			});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		return callback(errors.length ? errors : null);
	},

};
