"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/theme'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {
	get: Abstract.get.bind(this, 'theme'),
	delete: Abstract.delete.bind(this, 'theme'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'indicators')
			database.view('shortlists', 'by_type', {include_docs: true, key: 'theme'}, function(error, data) {
				var themes = {"": {indicatorIds: []}};
				data.rows.forEach(function(row) {
					row.doc.indicatorIds = [];
					themes[row.id] = row.doc;
				});

				database.view('shortlists', 'indicator_tree', {reduce: false}, function(error, indicators) {
					indicators.rows.forEach(function(row) {
						themes[row.key[0]].indicatorIds.push(row.id);
					});

					themes = Object.keys(themes).map(function(t) { return themes[t]; });

					return callback(null, themes);
				});
			});

		else
			database.view('shortlists', 'by_type', {include_docs: true, key: 'theme'}, function(error, data) {
				var themes = data.rows.map(function(row) { return row.doc; });
				if (!options.with_counts)
					return callback(null, themes);

				database.view('server', 'themes_usage', {group: true}, function(error, data) {
					var countByTheme = {};
					data.rows.forEach(function(row) { countByTheme[row.key] = row.value; });
					themes.forEach(function(theme) { theme.__usage = countByTheme[theme._id] || 0; });

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
