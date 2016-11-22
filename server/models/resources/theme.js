"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database'),
	schema    = require('./theme.json');;

var validate = validator(schema);

module.exports = {
	get: Abstract.get.bind(this, 'theme'),
	delete: Abstract.delete.bind(this, 'theme'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		database.view('shortlists', 'by_type', {include_docs: true, key: 'theme'}, function(error, data) {
			var themes = data.rows.map(function(row) { return row.doc; });
			if (!options.with_counts)
				return callback(null, themes);

			database.view('server', 'themes_usage', {group: true}, function(error, data) {
				themes.forEach(function(theme) {
					var projectUsage = data.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'project'; }),
						indicatorUsage = data.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'indicator'; });

					theme.__projectUsage   = projectUsage.length ? projectUsage[0].value : 0;
					theme.__indicatorUsage = indicatorUsage.length ? indicatorUsage[0].value : 0;
				});

				return callback(null, themes);
			});
		});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		return callback(errors.length ? errors : null);
	},

};
