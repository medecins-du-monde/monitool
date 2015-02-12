"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/theme'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {
	get: Abstract.get.bind(this, 'theme'),
	delete: Abstract.delete.bind(this, 'theme'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'tree') {
			async.map([
				['shortlists', 'indicator_tree', {reduce: false}],
				['shortlists', 'indicator_usage', {group: true}],
				['shortlists', 'by_type', {include_docs: true, key: 'theme'}],
				['shortlists', 'by_type', {include_docs: true, key: 'type'}],
			], function(params, callback) {
				database.view(params[0], params[1], params[2], callback);
			}, function(error, result) {
				var indicators = result[0], usage = result[1], themes = result[2], types = result[3];
				var indicatorsById = {}, themesById = {'': {children: {}}}, typesById = {'': {children: {}}};

				if (options.partial)
					indicators.rows = indicators.rows.filter(function(row) { return row.value.operation !== 'parameter'; });

				indicators.rows.forEach(function(row) {
					row.value.__mainUsage = row.value.__inputUsage = 0;
					indicatorsById[row.id] = row.value;
				});
				
				usage.rows.forEach(function(row) {
					var parts = row.key.split(':');
					indicatorsById[parts[1]]['__' + parts[0] + "Usage"] = row.value;
				});

				themes.rows.forEach(function(row) {
					row.doc.children = {};
					themesById[row.id] = row.doc;
				});

				types.rows.forEach(function(row) {
					row.doc.children = {};
					typesById[row.id] = row.doc;
				});

				var themes = {};
				indicators.rows.forEach(function(row) {
					var indicator = indicatorsById[row.id];

					if (!themes[row.key[0]])
						themes[row.key[0]] = JSON.parse(JSON.stringify(themesById[row.key[0]]));

					if (!themes[row.key[0]].children[row.key[1]])
						themes[row.key[0]].children[row.key[1]] = JSON.parse(JSON.stringify(typesById[row.key[1]]));;

					themes[row.key[0]].children[row.key[1]].children[row.id] = indicator;
				});

				themes = Object.keys(themes).map(function(themeId) { return themes[themeId]; });
				themes.forEach(function(theme) {
					theme.children = Object.keys(theme.children).map(function(typeId) { return theme.children[typeId]; });
					theme.children.forEach(function(type) {
						type.children = Object.keys(type.children).map(function(indicatorId) { return type.children[indicatorId]; });
					});
				});

				callback(null, themes);
			});
		}

		else if (options.mode === 'indicators')
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
					themes.forEach(function(theme) { theme.__indicatorUsage = countByTheme[theme._id] || 0; });

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