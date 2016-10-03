"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('../abstract');

var validate = validator({
	"$schema": "http://json-schema.org/schema#",
	"title": "Monitool user schema",
	"type": "object",
	"additionalProperties": false,
	"required": ["_id", "type", "name", "role"],

	"properties": {
		"_id":  {
			"type": "string",
			"pattern": "^usr:[a-z0-9\\.-]+$"
		},
		"_rev": { "$ref": "#/definitions/couchdb-revision" },
		"type": { "type": "string", "pattern": "^user$" },
		"name": { "type": "string", "minLength": 3 },
		"role": {
			"type": "string",
			"enum": ["admin", "project", "common"]
		}

	},
	"definitions": {
		"couchdb-revision": {
			"type": "string",
			"pattern": "^[0-9]+\\-[0-9a-f]{32}$"
		}
	}
});

module.exports = {
	list: Abstract.list.bind(this, 'user'),
	get: Abstract.get.bind(this, 'user'),
	delete: Abstract.delete.bind(this, 'user'),
	set: Abstract.set.bind(this),

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		return callback(errors.length ? errors : null);
	},

};
