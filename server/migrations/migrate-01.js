"use strict";

var nano = require('nano');


var productSingle = function(a, b) {
	var result = [], lengthA = a.length, lengthB = b.length;
	var k = 0;

	for (var i = 0; i < lengthA; ++i)
		for (var j = 0; j < lengthB; ++j)
			result[k++] = a[i].concat([b[j]]);
	
	return result;
};

/**
 * Return the product of two or more arrays.
 * in:  [[1,2],[3,4]]
 * out: [[1,3],[1,4],[2,3],[2,4]]
 */
var product = function(list) {
	if (list.length == 0)
		return [];

	var memo = list[0].map(function(el) { return [el]; });
	for (var i = 1; i < list.length; ++i)
		memo = productSingle(memo, list[i]);
	
	return memo;
}

/**
 * Given a input.value hash, compute all possible sums.
 * This is used for the agg data stats.
 */
var computeSums = function(values) {
	var result = {};

	for (var elementId in values) {
		result[elementId] = {};

		for (var partitionIds in values[elementId]) {
			// now we need to create a key for each subset of the partition.
			var splittedPartitionIds = partitionIds == '' ? [] : partitionIds.split('.'),
				numSubsets = Math.pow(2, splittedPartitionIds.length);

			for (var subsetIndex = 0; subsetIndex < numSubsets; ++subsetIndex) {
				var subsetKey = splittedPartitionIds.filter(function(id, index) { return subsetIndex & (1 << index); }).join('.');

				// if result was set as a string previously, skip
				if (typeof result[elementId][subsetKey] === 'string')
					continue

				// if value is a string, skip as well
				if (typeof values[elementId][partitionIds] === 'string') {
					result[elementId][subsetKey] = values[elementId][partitionIds];
					continue;
				}

				if (result[elementId][subsetKey] == undefined)
					result[elementId][subsetKey] = 0; // initialize if needed

				result[elementId][subsetKey] += values[elementId][partitionIds];
			}
		}
	}

	return result;
};




var old = nano('http://localhost:5984').use('monitool-prod-backup');
var newDb = nano('http://localhost:5984').use('monitool');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var documentsToKeep = [];

	var id;

	for (id in documents.theme) {
		var theme = documents.theme[id];
		documentsToKeep.push(theme);
	}

	for (id in documents.type) {
		var type = documents.type[id];
		documentsToKeep.push(type);
	}	

	for (id in documents.user) {
		var user = documents.user[id];
		documentsToKeep.push(user);
	}

	for (id in documents.project) {
		var project = documents.project[id];

		delete project._rev;

		// Fix entities
		project.entities.forEach(function(entity) { entity.start = entity.end = null; });

		// Fix users
		project.users = [];
		project.dataEntryOperators.forEach(function(dataEntryOperator) {
			project.users.push({type: 'internal', id: dataEntryOperator, role: "input_all"});
		});

		project.owners.forEach(function(owner) {
			var users = project.users.filter(function(projectUser) { return projectUser.id == owner; });
			if (users.length)
				users[0].role = 'owner';
			else
				project.users.push({type: 'internal', id: owner, role: "owner"});
		});

		delete project.owners;
		delete project.dataEntryOperators;

		// Fix forms
		project.forms.forEach(function(form) {
			if (form.useProjectStart)
				form.start = null;
			
			if (form.useProjectEnd)
				form.end = null;

			if (form.periodicity == 'planned')
				form.periodicity = 'free';
			
			delete form.active;
			delete form.intermediaryDates;
			delete form.useProjectStart;
			delete form.useProjectEnd;

			form.elements = [];
			form.sections.forEach(function(section) {
				form.elements = form.elements.concat(section.elements);
			});
			delete form.sections;
		});

		// Fix logical frame
		var fixIndicator = function(indicatorId) {
			var indicator = documents.indicator[indicatorId],
				planning  = project.indicators[indicatorId];

			var newIndicator = {
				display: indicator.name.fr,
				indicatorId: indicatorId,
				colorize: planning.colorize || false,
				baseline: planning.baseline || null,
				target: planning.target || null,
				unit: indicator.unit == '' ? 'none' : indicator.unit,
				targetType: indicator.target,
				formula: null,
				parameters: {}
			};

			// we leave the filters broken. Fixing by hand is going to be faster.
			if (planning.formula) {
				var formula = indicator.formulas[planning.formula];
				newIndicator.formula = formula.expression;
				for (var key in planning.parameters) {
					newIndicator.parameters[key] = {elementId: planning.parameters[key].variable, filter: {}};
					if (!planning.parameters[key].variable) {
						console.log('invalid complex indicator...');
						return null;
					}
				}
			}
			else if (planning.variable) {
				newIndicator.formula = 'default';
				newIndicator.parameters = {
					'default': {elementId: planning.variable, filter: {}}
				};
			}
			else {
				console.log('invalid simple indicator...');
				newIndicator = null;
			}

			return newIndicator;
		};

		var filterIndicator = function(indicator) {
			return !!indicator;
		};

		// give name to logical frame
		project.logicalFrame.name = "Default";

		// retrieve ids of all ASSIGNED indicators
		var indicatorIds = [];
		indicatorIds = indicatorIds.concat(project.logicalFrame.indicators)
		project.logicalFrame.purposes.forEach(function(purpose) {
			indicatorIds = indicatorIds.concat(purpose.indicators)
			purpose.outputs.forEach(function(output) {
				indicatorIds = indicatorIds.concat(output.indicators)
			});
		});

		// fix all assigned indicators
		project.logicalFrame.indicators = project.logicalFrame.indicators.map(fixIndicator).filter(filterIndicator);
		project.logicalFrame.purposes.forEach(function(purpose) {
			purpose.indicators = purpose.indicators.map(fixIndicator).filter(filterIndicator);
			purpose.outputs.forEach(function(output) {
				output.indicators = output.indicators.map(fixIndicator).filter(filterIndicator);
			});
		});

		// remove all assigned indicators from hash.
		indicatorIds.forEach(function(indicatorId) { delete project.indicators[indicatorId]; });

		// assign logframe to list, and create new logframe for extra indicators if needed
		project.logicalFrames = [project.logicalFrame];
		delete project.logicalFrame;

		if (Object.keys(project.indicators).length)
			project.logicalFrames.push({
				name: "Extra indicators",
				goal: "Extra indicators",
				indicators: Object.keys(project.indicators).map(fixIndicator),
				purposes: []
			});

		delete project.indicators;

		documentsToKeep.push(project);
	}

	// fix indicators
	for (id in documents.indicator) {
		var indicator = documents.indicator[id];

		delete indicator._rev;

		delete indicator.target;
		delete indicator.unit;
		delete indicator.formulas;

		documentsToKeep.push(indicator);
	}

	// fix inputs
	for (id in documents.input) {
		var input = documents.input[id];
		delete input._rev;


		var newValues = {};
		for (var key in input.values) {
			var index = key.indexOf('.');
			if (index == -1)
				newValues[key] = {'': input.values[key]};
			else {
				var elementId = key.substring(0, index),
					partitions = key.substring(index + 1);

				if (!newValues[elementId])
					newValues[elementId] = {};
				newValues[elementId][partitions] = input.values[key];
			}
		}

		newValues = computeSums(newValues);
		
		var realNewValue = {};
		var project = documents.project[input.project];
		var form, element;
		project.forms.forEach(function(f) { if (f.id == input.form) form = f;})

		form.elements.forEach(function(e) {
			var fields = product(e.partitions);

			if (e.partitions.length)
				realNewValue[e.id] = fields.map(function(partElements) {
					if (newValues[e.id] == undefined)
						return 0;

					return newValues[e.id][partElements.map(function(pe) { return pe.id }).sort().join('.')] || 0;
				});
			else
				realNewValue[e.id] = [newValues[e.id] ? newValues[e.id][''] || 0 : 0]
		});
		input.values = realNewValue;

		documentsToKeep.push(input);
	}

	newDb.bulk({docs: documentsToKeep}, function(error, done) {
		console.log(error);
	});

});

