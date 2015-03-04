"use strict";

var fs      = require('fs'),
	XLSX    = require('xlsx'),
	Project = require('../../server/models/project');


function makeLogFrame(project, indicatorsById) {
	var worksheet = {};

	// worksheet['!cols'] = []
	worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 10, r: 10}})
	worksheet['!merges'] = [
		{s: {c: 0, r: 0}, e: {c: 10, r: 0}}
	];

	worksheet.A1 = {t: 's', v: 'LOGICAL FRAMEWORK FOR THE PROJECT'};
	
	worksheet.B2 = {t: 's', v: 'Intervention logic'};
	worksheet.C2 = {t: 's', v: 'Objectively verifiable indicators of achievement'};
	worksheet.D2 = {t: 's', v: 'Sources and means of verification'};
	worksheet.E2 = {t: 's', v: 'Assumptions'};

	worksheet.A3 = {t: 's', v: 'Overall objectives'};
	worksheet.B3 = {t: 's', v: project.logicalFrame.goal};
	
	project.logicalFrame.indicators.forEach(function(indicatorId) {
		var indicator = indicatorsById[indicatorId];
		
	});

	return worksheet;
}

function makeSummaryOfIndicators(project, indicatorsById) {
	var worksheet = {};
	worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 0, r: 0}})


	return worksheet;
}

function makeProjectSummary(project, indicatorsById) {
	var workbook = { Sheets: {}, Props: {}, Custprops: {}, SheetNames: [] };

	workbook.SheetNames.push("Logical Frame", "Summary of indicators");
	workbook.Sheets["Logical Frame"] = makeLogFrame(project, indicatorsById);
	workbook.Sheets["Summary of indicators"] = makeSummaryOfIndicators(project, indicatorsById);

	return workbook;
}

Project.get('69e6f6b9-87ff-969f-8029-ab5782538623', function(error, project) {
	Indicator.list({mode: "project_reporting", projectId: project._id}, function(error, indicators) {
		var indicatorsById = {};
		indicators.forEach(function(i) { indicatorsById[i._id] = i; });

		var workbook = makeProjectSummary(project, indicatorsById);

		try { fs.mkdirSync('result'); }
		catch (e) {}

		XLSX.writeFile(workbook, './result/' + project.name + '.xlsx');
	});
});

