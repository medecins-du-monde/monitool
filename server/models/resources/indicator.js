"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	"$schema": "http://json-schema.org/schema#",
	"title": "Monitool indicator schema",
	"type": "object",
	"additionalProperties": true,
	"required": [
		// "_id", "type", "name", "unit", "types", "themes", "formulas"
	],
	"properties": {
		"_id":  { "$ref": "#/definitions/uuid" },
		"_rev": { "$ref": "#/definitions/couchdb-revision" },
		"type": { "type": "string", "pattern": "^indicator$" },

		"name":       { "$ref": "#/definitions/translated_req" },
		"standard":   { "$ref": "#/definitions/translated" },
		"sources":    { "$ref": "#/definitions/translated" },
		"comments":   { "$ref": "#/definitions/translated" },

		"operation": { "type": "string", "enum": ["mandatory", "approved", "waiting", "forbidden"] },
		"target":    { "type": "string", "enum": ["lower_is_better", "higher_is_better", "around_is_better", "non_relevant"] },
		"unit":      { "type": "string", "enum": ["‰", "%", ""] },

		"types": {
			"type": "array",
			"uniqueItems": true,
			"items": { "$ref": "#/definitions/uuid" }
		},

		"themes": {
			"type": "array",
			"uniqueItems": true,
			"items": { "$ref": "#/definitions/uuid" }
		},

		"formulas": {
			"type": "object",
			"patternProperties": {
				"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$": {
					"type": "object",
					"additionalProperties": false,

					"properties": {
						"expression": { "type": "string", "minLength": 1 },
						"parameters": {
						}
					}
				}
			}
		}
	},
	"definitions": {
		"translated_req": {
			"type": "object",
			"additionalProperties": false,
			"properties": {
				"en": { "type": "string", "minLength": 1 },
				"fr": { "type": "string", "minLength": 1 },
				"es": { "type": "string", "minLength": 1 }
			}
		},

		"translated": {
			"type": "object",
			"additionalProperties": false,
			"properties": {
				"en": { "type": "string" },
				"fr": { "type": "string" },
				"es": { "type": "string" }
			}
		},

		"uuid": {
			"type": "string",
			"pattern": "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
		},
		"couchdb-revision": {
			"type": "string",
			"pattern": "^[0-9]+\\-[0-9a-f]{32}$"
		}
	}
});

var Indicator = module.exports = {
	get: Abstract.get.bind(this, 'indicator'),

	list: function(options, callback) {
		var opt;

		if (options.mode === 'project') {
			if (!options.projectId)
				return callback('missing_parameter')

			// the indicators used by the project + all their dependencies (for the used formulas)
			database.get(options.projectId, function(error, project) {
				if (error)
					return callback('no_such_project');

				var indicatorIds = Object.keys(project.indicators) || [];
				return Abstract.list('indicator', {ids: indicatorIds}, callback);
			});
		}
		else
			return Abstract.list('indicator', options, callback);
	},

	set: function(newIndicator, callback) {
		database.get(newIndicator._id, function(error, oldIndicator) {
			if (oldIndicator) {
				// Retrieve all changed formula ids.
				var changedFormulasIds = Object.keys(oldIndicator.formulas).filter(function(formulaId) {
					if (!newIndicator.formulas[formulaId])
						return true;
					
					var oldParameters = Object.keys(oldIndicator.formulas[formulaId].parameters).sort(),
						newParameters = Object.keys(newIndicator.formulas[formulaId].parameters).sort();

					return JSON.stringify(oldParameters) !== JSON.stringify(newParameters);
				});

				// Fetch all projectIds that use this formula in a datacollection
				database.view('server', 'reverse_dependencies', {keys: changedFormulasIds, reduce: false, offset: 0, include_docs: true}, function(error, result) {
					// Fetch all projects.
					var projects = result.rows.map(function(row) { return row.doc; });

					// unset the indicator computation.
					projects.forEach(function(project) {
						var indicatorMeta = project.indicators[newIndicator._id];
						indicatorMeta.formula = null,
						indicatorMeta.variable = null,
						indicatorMeta.filter = []
						delete indicatorMeta.parameters;
					});

					// save them all
					database.bulk({docs: projects}, function() {
						Abstract.set(newIndicator, callback);
					});
				});
			}
			else
				Abstract.set(newIndicator, callback);
		});
	},

	"delete": function(id, callback) {
		var options = {keys: [id], reduce: false, offset: 0, include_docs: true};

		database.view('server', 'reverse_dependencies', options, function(error, result) {
			var projects = result.rows.map(function(row) { return row.doc; })

			projects.forEach(function(project) {
				delete project.indicators[id];

				project.logicalFrame.indicators = project.logicalFrame.indicators.filter(function(indicatorId) { return indicatorId !== id; });
				project.logicalFrame.purposes.forEach(function(purpose) {
					purpose.indicators = purpose.indicators.filter(function(indicatorId) { return indicatorId !== id; });
					purpose.outputs.forEach(function(output) {
						output.indicators = output.indicators.filter(function(indicatorId) { return indicatorId !== id; });
					});
				});
			});

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

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		return callback(null);
	}
	
};
