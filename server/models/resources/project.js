"use strict";

var validator = require('is-my-json-valid'),
	async     = require('async'),
	Abstract  = require('../abstract'),
	database  = require('../database');

var validate = validator({
	"$schema": "http://json-schema.org/schema#",
	"title": "Monitool project schema",
	"type": "object",
	// "additionalProperties": false,
	"additionalProperties": true,

	"required": [
		// "_id", "type", "name", "begin", "end", "indicators", "dataCollection", "themes",
		// "inputEntities", "inputGroups", "logicalFrame", "owners", "dataEntryOperators"
	],

	"properties": {
		// "_id":   { "$ref": "#/definitions/uuid" },
		// "_rev":  { "$ref": "#/definitions/couchdb-revision" },
		// "type":  { "type": "string", "pattern": "^project$" },
		// "name":  { "type": "string", "minLength": 1 },
		// "begin": { "type": "string", "format": "date" },
		// "end":   { "type": "string", "format": "date" },
		
		// "themes": {
		// 	"type": "array",
		// 	"uniqueItems": true,
		// 	"items": {
		// 		"$ref": "#/definitions/uuid"
		// 	}
		// },

		// "indicators": {
		// 	"type": "object",
		// 	"patternProperties": {
		// 		"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$": {
		// 			"type": "object",
		// 			"additionalProperties": false,
		// 			"required": [
		// 				"relevance", "inCharge", "source"
		// 			],
		// 			"properties": {
		// 				"relevance": { "type": "string", "minLength": 1 },
		// 				"source": { "type": "string", "minLength": 1 },
		// 				"inCharge": { "type": "string", "minLength": 1 },
		// 				"baseline": { "type": ["number", "null"] },
		// 				"target": { "type": ["number", "null"] },
		// 				"showRed": { "type": "number" },
		// 				"showYellow": { "type": "number" },

		// 				"formula": {},
		// 				"variable": {},
		// 				"filter": {},
		// 				"parameters": {}

		// 			}
		// 		}
		// 	}
		// },

		// "dataCollection": {
		// 	"type": "array",
		// 	"items": {
		// 		"type": "object",
		// 		"required": ["id", "name", "start", "end", "active", "useProjectStart", "useProjectEnd", "periodicity", "intermediaryDates"],
		// 		"additionalProperties": false,
		// 		"properties": {
		// 			"id":    { "$ref": "#/definitions/uuid" },
		// 			"name":  { "type": "string", "minLength": 1 },
		// 			"start": { "type": "string", "format": "date" },
		// 			"end":   { "type": "string", "format": "date" },
					
		// 			"active": { "type": "boolean" },
		// 			"useProjectStart": { "type": "boolean" },
		// 			"useProjectEnd": { "type": "boolean" },

		// 			"periodicity": {
		// 				"type": "string",
		// 				"enum": ["day", "week", "month", "quarter", "year", "planned"]
		// 			},

		// 			"collect": {
		// 				"type": "string",
		// 				"enum": ["project", "entity"]
		// 			},

		// 			"intermediaryDates": {
		// 				"type": "array",
		// 				"items": { "type": "string", "format": "date" }
		// 			},
					
		// 			"rawData": {}
		// 		}
		// 	}
		// },
		
		// "inputEntities": {
		// 	"type": "array",
		// 	"items": {
		// 		"id":   { "$ref": "#/definitions/uuid" },
		// 		"name": { "type": "string", "minLength": 1 }	
		// 	}
		// },

		// "inputGroups": {
		// 	"type": "array",
		// 	"items": {
		// 		"type": "object",
		// 		"properties": {
		// 			"id":      { "$ref": "#/definitions/uuid" },
		// 			"name":    { "type": "string", "minLength": 1 },
		// 			"members": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
		// 		}
		// 	}
		// },

		// "logicalFrame": {
		// 	"type": "object",
		// 	"additionalProperties": false,
		// 	"properties": {
		// 		"goal": { "type": "string", "minLength": 1 },
		// 		"purposes": {
		// 			"type": "array",
		// 			"items": {
		// 				"type": "object",
		// 				"additionalProperties": false,
		// 				"properties": {
		// 					"description": { "type": "string", "minLength": 1 },
		// 					"assumptions": { "type": "string" },
		// 					"outputs": {
		// 						"type": "array",
		// 						"items": {
		// 							"type": "object",
		// 							"additionalProperties": false,
		// 							"properties": {
		// 								"description": { "type": "string", "minLength": 1 },
		// 								"assumptions": { "type": "string" },
		// 								"activities": {
		// 									"type": "array",
		// 									"items": {
		// 										"type": "object",
		// 										"additionalProperties": false,
		// 										"required": ["description"],
		// 										"properties": {
		// 											"description": { "type": "string", "minLength": 1 }
		// 										}
		// 									}
		// 								},
		// 								"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
		// 							}
		// 						}
		// 					},
		// 					"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
		// 				}
		// 			}
		// 		},
		// 		"indicators": { "type": "array", "items": { "$ref": "#/definitions/uuid" }}
		// 	}
		// },

		// "owners":             { "$ref": "#/definitions/user-list" },
		// "dataEntryOperators": { "$ref": "#/definitions/user-list" }
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


/**
 * ['8655ac1c-2c43-43f6-b4d0-177ad2d3eb8e', '1847b479-bc08-4ced-9fc3-a569b168a764'] => 232
 */
function getFieldIndex(partitions, partitionElementIds) {
	var numPartitions = partitions.length;

	if (partitionElementIds.length != numPartitions)
		throw new Error('Invalid partitionElementIds.length');

	var fieldIndex = 0;
	for (var i = 0; i < numPartitions; ++i) {
		// array find.
		for (var index = 0; index < partitions[i].length; ++index)
			if (partitions[i][index].id == partitionElementIds[i])
				break;

		if (index == partitions[i].length)
			throw new Error('Invalid partitionElementId');

		// compute field index.
		fieldIndex = fieldIndex * partitions[i].length + index;
	}

	return fieldIndex;
}


/**
 * 232 => ['8655ac1c-2c43-43f6-b4d0-177ad2d3eb8e', '1847b479-bc08-4ced-9fc3-a569b168a764']
 */
function getPartitionElementIds(partitions, fieldIndex) {
	var numPartitions = partitions.length,
		partitionElementIds = new Array(numPartitions);

	if (fieldIndex < 0)
		throw new Error('Invalid field index (negative)')

	for (var i = numPartitions - 1; i >= 0; --i) {
		partitionElementIds[i] = partitions[i][fieldIndex % partitions[i].length].id;
		fieldIndex = Math.floor(fieldIndex / partitions[i].length);
	}

	if (fieldIndex !== 0)
		throw new Error('Invalid field index (too large)')

	return partitionElementIds;
}


function correctFormInputs(oldForm, newForm, inputs) {
	// Compute fields for new inputs format.
	newForm.elements.forEach(function(newElement) {
		// Retrieve old form element
		var oldElement = oldForm.elements.filter(function(el) { return el.id == newElement.id});

		// Compute new form element size.
		var newSize = 1;
		newElement.partitions.forEach(function(partition) { newSize *= partition.length });

		// if the form element did not exist before, fill with zeros.
		if (oldElement.length == 0) {
			inputs.forEach(function(input) {
				input.values[newElement.id] = new Array(newSize);
				for (var fieldIndex = 0; fieldIndex < newSize; ++fieldIndex)
					input.values[newElement.id][fieldIndex] = 0;
			}, this);
		}
		// if the form element existed before, we rebuild the new value from the former one, or fill with zeros.
		else {
			oldElement = oldElement[0];
			inputs.forEach(function(input) {
				var decodedValues = {};

				// Iterate on all fields from old input.
				input.values[oldElement.id].forEach(function(field, fieldIndex) {
					// which partition does this field correspond to?
					var peIds = getPartitionElementIds(oldElement.partitions, fieldIndex).sort();

					// compute all possibles partitions sums for this field.
					var numSubsets = Math.pow(2, peIds.length);
					for (var subsetIndex = 0; subsetIndex < numSubsets; ++subsetIndex) {
						var subsetKey = peIds.filter(function(id, index) { return subsetIndex & (1 << index); }).join('.');

						if (decodedValues[subsetKey] == undefined)
							decodedValues[subsetKey] = 0;
						decodedValues[subsetKey] += field || 0;
					}
				});

				// Replace input array with a new one.
				input.values[newElement.id] = new Array(newSize);

				// Fill it using same magic as before.
				for (var fieldIndex = 0; fieldIndex < newSize; ++fieldIndex) {
					// now that we have our index and value, we have to guess from which partition elements
					// they come from.
					var key = getPartitionElementIds(newElement.partitions, fieldIndex).sort().join('.');
					input.values[newElement.id][fieldIndex] = decodedValues[key] || 0;
				}

			}, this);
		}
	}, this);

	// Remove useless inputs.
	inputs.forEach(function(input) {
		for (var elementId in input.values) {
			var elements = newForm.elements.filter(function(e) { return e.id == elementId; });
			if (elements.length === 0)
				delete input.values[elementId];
		}
	});
}

// We extract the id of all elements and partition elements with their orders.
// If some partition name changes, we do not need to update inputs.
// we use only array (no hashmaps) to be sure that the JSON reprs will be the same.
function extractRelevantInformation(form) {
	return form.elements.map(function(element) {
		return [
			element.id,
			element.partitions.map(function(partition) {
				return partition.map(function(partitionElement) {
					return partitionElement.id;
				})
			})
		];
	});
}

function updateInputs(oldForm, newForm, callback) {
	database.view(
		'reporting',
		'inputs_by_form_date',
		{include_docs: true, startkey: [oldForm.id], endkey: [oldForm.id, {}]},
		function(error, result) {
			var inputs = result.rows.map(function(row) { return row.doc; });
			correctFormInputs(oldForm, newForm, inputs);
			database.bulk({docs: inputs}, {}, callback);
		}
	);
}

function correctProjectInputs(oldProject, newProject, callback) {
	var tasks = [];

	// iterate on all new forms, to check if they need updating.
	newProject.forms.forEach(function(newForm) {
		// Retrieve old form
		var oldForm = oldProject.forms.filter(function(f) { return f.id == newForm.id; });
		if (oldForm.length)
			oldForm = oldForm[0];
		else
			return;

		// compare to old and new
		if (JSON.stringify(extractRelevantInformation(oldForm)) !==
			JSON.stringify(extractRelevantInformation(newForm))) {

			// we need to fetch all inputs and update them.
			tasks.push(updateInputs.bind(null, oldForm, newForm));
		}
	});

	if (tasks.length)
		async.parallel(tasks, callback)
	else
		callback();
}

function removeUnlinkedInputs(mode, oldProject, newProject, removeFinishedCallback) {
	var listName = {entity: 'entities', form: 'forms'}[mode];

	var oldForms = oldProject[listName].map(function(f) { return f.id; }),
		newForms = newProject[listName].map(function(f) { return f.id; }),
		removedForms = oldForms.filter(function(id) { return newForms.indexOf(id) === -1; });

	if (!removedForms.length)
		removeFinishedCallback();

	else
		async.map(
			removedForms,
			function(formId, cb) {
				var opt = {include_docs: true, startkey: [formId], endkey: [formId, {}]};

				database.view('reporting', 'inputs_by_' + mode + '_date', opt, function(error, result) {
					cb(null, result.rows.map(function(row) { return {_id: row.id, _rev: row.doc._rev, _deleted: true}; }));
				});
			},
			function(error, inputs) {
				inputs = Array.prototype.concat.apply([], inputs);
				if (!inputs.length)
					removeFinishedCallback()
				else
					// Assume that the operation goes well
					database.bulk({docs: inputs}, {}, removeFinishedCallback);
			}
		);
}


module.exports = {

	_getFieldIndex: getFieldIndex,
	_getPartitionElementIds: getPartitionElementIds,
	_correctFormInputs: correctFormInputs,
	_extractRelevantInformation: extractRelevantInformation,
	_updateInputs: updateInputs,
	_correctProjectInputs: correctProjectInputs,
	_removeUnlinkedInputs: removeUnlinkedInputs,

	get: Abstract.get.bind(this, 'project'),

	delete: function(id, callback) {
		var opts = {include_docs: true, startkey: [id], endkey: [id, {}]};

		database.view('reporting', 'inputs_by_project_date', opts, function(error, result) {
			var inputs = result.rows.map(function(row) {
				return { _id: row.id, _rev: row.doc._rev, _deleted: true };
			});

			database.bulk({docs: inputs}, {}, function() {
				Abstract.delete('project', id, callback);
			});
		});
	},

	list: function(options, callback) {
		if (options.mode === 'indicator_reporting')
			database.view('shortlists', 'projects_by_indicator', {key: options.indicatorId, include_docs: true, reduce: false}, function(error, result) {
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

		database.get(newProject._id, function(error, oldProject) {
			if (oldProject)
				removeUnlinkedInputs('entity', oldProject, newProject, function() {
					removeUnlinkedInputs('form', oldProject, newProject, function() {
						correctProjectInputs(oldProject, newProject, function() {
							Abstract.set(newProject, callback);
						});
					});
				});
			
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
		var entityIds = item.entities.map(function(e) { return e.id; });
		item.groups.forEach(function(group) {
			group.members.forEach(function(entityId) {
				if (entityIds.indexOf(entityId) === -1)
					errors.push({field: "groups.members", message: entityId + ' is unknown.'});
			});
		});

		return callback(errors.length ? errors : null);
	}

};
