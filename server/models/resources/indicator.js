"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	$schema: "http://json-schema.org/schema#",
	title: "Monitool indicator schema",
	type: "object",
	additionalProperties: false,
	required: [
		"_id", "type", "name", "description", "themes"
	],
	properties: {
		_id:       { $ref: "#/definitions/uuid" },
		_rev:      { $ref: "#/definitions/revision" },
		description:  { $ref: "#/definitions/translated" },
		name:      { $ref: "#/definitions/translated_req" },
		type:      { type: "string", "pattern": "^indicator$" },
		themes: {
			type: "array",
			uniqueItems: true,
			items: { "$ref": "#/definitions/uuid" }
		}
	},
	definitions: {
		translated_req: {
			type: "object",
			additionalProperties: false,
			properties: {
				en: { type: "string", minLength: 1 },
				fr: { type: "string", minLength: 1 },
				es: { type: "string", minLength: 1 }
			}
		},

		translated: {
			type: "object",
			additionalProperties: false,
			properties: {
				en: { type: "string" },
				fr: { type: "string" },
				es: { type: "string" }
			}
		},

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
