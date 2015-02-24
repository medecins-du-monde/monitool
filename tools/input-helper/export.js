"use strict";

var XLSX       = require('xlsx'),
	moment     = require('moment'),
	getPeriods = require('./lib').getPeriods,
	getFields  = require('./lib').getFields;

var Project   = require('../../server/models/project'),
	Indicator = require('../../server/models/indicator'),
	Input     = require('../../server/models/input');


function makePresentationWorkSheet(project) {
	var worksheet = {};

	worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 2, r: 2}})
	worksheet.A1 = {t: 's', v: project._id};
	worksheet.A2 = {t: 's', v: project._rev};

	return worksheet;
};

function makeWorkSheet(entity, project, entityInputs, indicatorsById) {
	var worksheet = {};

	var maxRow = 0, maxCol = 0;

	project.dataCollection.forEach(function(form) {
		var inputs  = entityInputs.filter(function(i) { return i.form === form.id; }),
			periods = getPeriods(form, project),
			fields  = getFields(form, indicatorsById);

		// create row and columns titles
		fields.forEach(function(field, index) {
			worksheet[XLSX.utils.encode_cell({c: 0, r: maxRow + index + 1})] = {t: 's', v: field.name, c: field.id};
		});
		periods.forEach(function(period, index) {
			worksheet[XLSX.utils.encode_cell({c: index + 1, r: maxRow})] = {t: 's', v: period.format('YYYY-MM-DD')};
		});

		// create data.
		var periodList = periods.map(function(p) { return p.format('YYYY-MM-DD'); }),
			pathList   = fields.map(function(f) { return f.path; });

		inputs.forEach(function(input) {
			var col = periodList.indexOf(input.period);

			for (var path in input.values) {
				var row = pathList.indexOf(path);

				if (row !== -1)
					worksheet[XLSX.utils.encode_cell({c: col + 1, r: maxRow + row + 1})] = {t: 'n', v: input.values[path]};
			}
		});

		maxCol = Math.max(periods.length + 1, maxCol);
		maxRow += fields.length + 2;
	});

	worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: maxCol, r: maxRow}})

	return worksheet;
};

Project.list({}, function(error, projects) {
	projects.forEach(function(project) {
		Indicator.list({mode: "project_reporting", projectId: project._id}, function(error, indicators) {
			Input.list({mode: 'project_inputs', projectId: project._id}, function(error, inputs) {
				var indicatorsById = {};
				indicators.forEach(function(i) { indicatorsById[i._id] = i; });

				var workbook = { Sheets: {}, Props: {}, Custprops: {}, SheetNames: [] };
				
				workbook.SheetNames.push('META');
				workbook.Sheets.META = makePresentationWorkSheet(project);

				// Create one sheet for every entity
				project.inputEntities.forEach(function(inputEntity) {
					var entityInputs = inputs.filter(function(i) { return i.entity === inputEntity.id; });
					var worksheet = makeWorkSheet(inputEntity, project, entityInputs, indicatorsById);
					workbook.Sheets[inputEntity.name] = worksheet;
					workbook.SheetNames.push(inputEntity.name);
				});
				
				XLSX.writeFile(workbook, 'result/' + project.name + '.xlsx');
			});
		});
	});
});


// Cell A3 {c:0, r:2}
// Range A3:B7 {s:{c:0, r:2}, e:{c:1, r:6}}
// utils.encode_col
// utils.encode_row
// utils.encode_cell
// utils.encode_range
// utils.decode_col
// utils.decode_row
// utils.split_cell
// utils.decode_cell
// utils.decode_range
// utils.format_cell
// utils.get_formulae
// utils.sheet_to_csv
// utils.sheet_to_json
// utils.sheet_to_formulae
// utils.sheet_to_row_object_array
