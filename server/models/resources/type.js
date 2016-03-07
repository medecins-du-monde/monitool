"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	$schema: "http://json-schema.org/schema#",
	title: "Monitool type schema",
	type: "object",
	additionalProperties: false,
	required: [ "_id", "type", "name" ],

	properties: {
		_id:  { $ref: "#/definitions/uuid" },
		_rev: { $ref: "#/definitions/revision" },
		type: { type: "string", pattern: "^type$" },
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

var Type = module.exports = {
	get: Abstract.get.bind(this, 'type'),
	delete: Abstract.delete.bind(this, 'type'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		database.view('shortlists', 'by_type', {include_docs: true, key: 'type'}, function(error, data) {
			var types = data.rows.map(function(row) { return row.doc; });
			if (!options.with_counts)
				return callback(null, types);

			database.view('server', 'types_usage', {group: true}, function(error, data) {
				var countByType = {};
				data.rows.forEach(function(row) { countByType[row.key] = row.value; });
				types.forEach(function(type) { type.__indicatorUsage = countByType[type._id] || 0; });

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
