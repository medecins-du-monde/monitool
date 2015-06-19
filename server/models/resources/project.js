"use strict";

var validator = require('is-my-json-valid'),
	async     = require('async'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	"$schema": "http://json-schema.org/schema#",
	"title": "Monitool project schema",
	"type": "object",
	"additionalProperties": false,

	"required": [
		"_id", "type", "name", "begin", "end", "indicators", "dataCollection", "themes",
		"inputEntities", "inputGroups", "logicalFrame", "owners", "dataEntryOperators"
	],

	"properties": {
		"_id":   { "$ref": "#/definitions/uuid" },
		"_rev":  { "$ref": "#/definitions/couchdb-revision" },
		"type":  { "type": "string", "pattern": "^project$" },
		"name":  { "type": "string", "minLength": 1 },
		"begin": { "type": "string", "format": "date" },
		"end":   { "type": "string", "format": "date" },
		
		"themes": {
			"type": "array",
			"uniqueItems": true,
			"items": {
				"$ref": "#/definitions/uuid"
			}
		},

		"indicators": {
			"type": "object",
			"patternProperties": {
				"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$": {
					"type": "object",
					"additionalProperties": false,
					"required": [
						"relevance", "inCharge", "source"
					],
					"properties": {
						"relevance": { "type": "string", "minLength": 1 },
						"source": { "type": "string", "minLength": 1 },
						"inCharge": { "type": "string", "minLength": 1 },
						"baseline": { "type": ["number", "null"] },
						"target": { "type": ["number", "null"] },
						"showRed": { "type": "number" },
						"showYellow": { "type": "number" },

						"formula": {},
						"variable": {},
						"filter": {},
						"parameters": {}

					}
				}
			}
		},

		"dataCollection": {
			"type": "array",
			"items": {
				"type": "object",
				"required": ["id", "name", "start", "end", "active", "useProjectStart", "useProjectEnd", "periodicity", "intermediaryDates"],
				"additionalProperties": false,
				"properties": {
					"id":    { "$ref": "#/definitions/uuid" },
					"name":  { "type": "string", "minLength": 1 },
					"start": { "type": "string", "format": "date" },
					"end":   { "type": "string", "format": "date" },
					
					"active": { "type": "boolean" },
					"useProjectStart": { "type": "boolean" },
					"useProjectEnd": { "type": "boolean" },

					"periodicity": {
						"type": "string",
						"enum": ["day", "week", "month", "quarter", "year", "planned"]
					},

					"collect": {
						"type": "string",
						"enum": ["project", "entity"]
					},

					"intermediaryDates": {
						"type": "array",
						"items": { "type": "string", "format": "date" }
					},
					
					"rawData": {}
				}
			}
		},
		
		"inputEntities": {
			"type": "array",
			"items": {
				"id":   { "$ref": "#/definitions/uuid" },
				"name": { "type": "string", "minLength": 1 }	
			}
		},

		"inputGroups": {
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"id":      { "$ref": "#/definitions/uuid" },
					"name":    { "type": "string", "minLength": 1 },
					"members": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
				}
			}
		},

		"logicalFrame": {
			"type": "object",
			"additionalProperties": false,
			"properties": {
				"goal": { "type": "string", "minLength": 1 },
				"purposes": {
					"type": "array",
					"items": {
						"type": "object",
						"additionalProperties": false,
						"properties": {
							"description": { "type": "string", "minLength": 1 },
							"assumptions": { "type": "string" },
							"outputs": {
								"type": "array",
								"items": {
									"type": "object",
									"additionalProperties": false,
									"properties": {
										"description": { "type": "string", "minLength": 1 },
										"assumptions": { "type": "string" },
										"activities": {
											"type": "array",
											"items": {
												"type": "object",
												"additionalProperties": false,
												"required": ["description"],
												"properties": {
													"description": { "type": "string", "minLength": 1 }
												}
											}
										},
										"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
									}
								}
							},
							"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
						}
					}
				},
				"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
			}
		},

		"owners":             { "$ref": "#/definitions/user-list" },
		"dataEntryOperators": { "$ref": "#/definitions/user-list" }
	},

	"definitions": {
		"uuid": {
			"type": "string",
			"pattern": "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
		},
		"couchdb-revision": {
			"type": "string",
			"pattern": "^[0-9]+\\-[0-9a-f]{32}$"
		},
		"user-list": {

		}
	}
});

module.exports = {

	get: Abstract.get.bind(this, 'project'),
	delete: Abstract.delete.bind(this, 'project'),

	list: function(options, callback) {
		if (options.mode === 'indicator_reporting')
			database.view('shortlists', 'projects_by_indicator', {key: options.indicatorId, include_docs: true}, function(error, result) {
				callback(null, result.rows.map(function(row) { return row.doc; }));
			});

		else if (options.mode === 'list')
			database.view('shortlists', 'projects_short', {}, function(error, result) {
				callback(null, result.rows.map(function(row) { return row.value; }));
			});

		else
			Abstract.list('project', options, callback);
	},

	set: function(newProject, callback) {
		var removeInputs = function(mode, oldProject, newProject, removeFinishedCallback) {
			var listName = {entity: 'inputEntities', form: 'dataCollection'}[mode];

			var oldForms = oldProject[listName].map(function(f) { return f.id; }),
				newForms = newProject[listName].map(function(f) { return f.id; }),
				removedForms = oldForms.filter(function(id) { return newForms.indexOf(id) === -1; });

			if (!removedForms.length)
				removeFinishedCallback();

			else
				async.map(removedForms, function(formId, cb) {
					var opt = {include_docs: true, startkey: [formId], endkey: [formId, {}]};

					database.view('reporting', 'inputs_by_' + mode + '_date', opt, function(error, result) {
						cb(null, result.rows.map(function(row) { return {_id: row.id, _rev: row.doc._rev, _deleted: true}; }));
					});
				}, function(error, inputs) {
					inputs = Array.prototype.concat.apply([], inputs);
					if (!inputs.length)
						removeFinishedCallback()
					else
						// Assume that the operation goes well
						database.bulk({docs: inputs}, {}, removeFinishedCallback);
				});
		};

		database.get(newProject._id, function(error, oldProject) {
			if (oldProject) {
				removeInputs('entity', oldProject, newProject, function() {
					removeInputs('form', oldProject, newProject, function() {
						Abstract.set(newProject, callback);
					});
				});
			}
			else
				Abstract.set(newProject, callback);
		});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// Check group ids
		var entityIds = item.inputEntities.map(function(e) { return e.id; });
		item.inputGroups.forEach(function(group) {
			group.members.forEach(function(entityId) {
				if (entityIds.indexOf(entityId) === -1)
					errors.push({field: "inputGroups.members", message: entityId + ' is unknown.'});
			});
		});

		return callback(errors.length ? errors : null);
	},

};
