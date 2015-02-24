"use strict";

var async      = require('async'),
	XLSX       = require('xlsx'),
	moment     = require('moment'),
	getPeriods = require('./lib').getPeriods,
	getFields  = require('./lib').getFields;

var Project   = require('../../server/models/project'),
	Indicator = require('../../server/models/indicator'),
	Input     = require('../../server/models/input');

var workbook   = XLSX.readFile(process.argv[2]),
	projectId  = workbook.Sheets.META.A1.v,
	projectRev = workbook.Sheets.META.A2.v;

Project.get(projectId, function(error, project) {
	if (project._rev !== projectRev) {
		console.log('Project', project.name, 'was modified.')
		process.exit(1);
	}

	Indicator.list({mode: "project_reporting", projectId: project._id}, function(error, indicators) {
		Input.list({mode: 'project_inputs', projectId: project._id}, function(error, inputs) {
			var indicatorsById = {}, inputsById = {};
			indicators.forEach(function(i) { indicatorsById[i._id] = i; });
			inputs.forEach(function(i) { inputsById[i._id] = i; });

			var curRow = 0;

			project.dataCollection.forEach(function(form) {
				var periods = getPeriods(form, project).map(function(p) { return p.format('YYYY-MM-DD'); }),
					fields  = getFields(form, indicatorsById)/*.map(function(f) { return f.path; })*/;

				project.inputEntities.forEach(function(entity) {
					var worksheet = workbook.Sheets[entity.name];
					if (!worksheet)
						return console.log('Missing sheet', entity.name);

					periods.forEach(function(period, periodIndex) {
						// retrieve or create the couchdb input.
						var inputId = [project._id, entity.id, form.id, period].join(':');
						if (!inputsById[inputId])
							inputsById[inputId] = {_id: inputId, type: "input", project: project._id, entity: entity.id, form: form.id, period: period, values: {count: 1}};
						
						var input = inputsById[inputId];

						fields.forEach(function(field, fieldIndex) {
							// check that row&col were not modified.
							var excelPeriod    = worksheet[XLSX.utils.encode_cell({c: periodIndex + 1, r: curRow})],
								excelIndicator = worksheet[XLSX.utils.encode_cell({c: 0, r: curRow + fieldIndex + 1})],
								excelField     = worksheet[XLSX.utils.encode_cell({c: periodIndex + 1, r: curRow + fieldIndex + 1})],
								printName      = '`' + entity.name + '`' + XLSX.utils.encode_cell({c: periodIndex + 1, r: curRow + fieldIndex + 1});

							if (excelPeriod.v !== period)
								return console.log('Unexpected period: Skipping', printName);
							if (excelIndicator.v !== field.name)
								return console.log('Unexpected indicator: Skipping', printName);
							if (!excelField)
								return console.log("Missing value at", printName);
							if (excelField.t !== 'n')
								return console.log("Invalid type at", printName);

							// copy field value
							input.values[field.path] = excelField.v;
						});
					});
				});

				curRow += fields.length + 2;
			});

			async.series(
				Object.keys(inputsById).map(function(inputId) { return Input.set.bind(Input, inputsById[inputId]); }),
				function(error, results) {
					console.log("Importing done:", results.length, "documents were updated.");
				}
			);
		});
	});
});