"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	$schema: "http://json-schema.org/schema#",
	title: "Monitool theme schema",
	type: "object",
	additionalProperties: false,
	required: [ "_id", "type", "name" ],
	
	properties: {
		_id:  { $ref: "#/definitions/uuid" },
		_rev: { $ref: "#/definitions/revision" },
		type: { type: "string", pattern: "^theme$" },
		name: {
			type: "object",
			additionalProperties: false,
			properties: {
				en: { type: "string", minLength: 1 },
				fr: { type: "string", minLength: 1 },
				es: { type: "string", minLength: 1 }
			}
		}
	},
	definitions: {
		uuid: {
			type: "string",
			pattern: "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
		},
		revision: {
			type: "string",
			pattern: "^[0-9]+\\-[0-9a-f]{32}$"
		}
	}
});


module.exports = {
	get: Abstract.get.bind(this, 'theme'),
	delete: Abstract.delete.bind(this, 'theme'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		if (options.mode === 'tree') {
			async.map([
				['shortlists', 'indicator_tree', {reduce: false}],
				['shortlists', 'projects_by_indicator', {group: true}],
				['shortlists', 'by_type', {include_docs: true, key: 'theme'}],
				['shortlists', 'by_type', {include_docs: true, key: 'type'}],
			], function(params, callback) {
				database.view(params[0], params[1], params[2], callback);
			}, function(error, result) {
				var indicators = result[0], usage = result[1], themes = result[2], types = result[3];
				var indicatorsById = {}, themesById = {'': {children: {}}}, typesById = {'': {children: {}}};

				indicators.rows.forEach(function(row) {
					row.value.__usage = 0;
					indicatorsById[row.id] = row.value;
				});
				
				usage.rows.forEach(function(row) {
					if (indicatorsById[row.key])
						indicatorsById[row.key].__usage = row.value;
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

		else
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
