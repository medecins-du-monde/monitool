"use strict";

console.log("This script is outdated, update it if you need it");
console.log("The description of the data structures can be found on server/models/schemas");
process.exit(1);

var lipsum   = require('lorem-ipsum'),
	moment   = require('moment'),
	uuid     = require('node-uuid'),
	readline = require('readline-sync'),
	request  = require('request');

function randomDate(min) {
	if (min === '2015-12')
		return '2015-12';

	var years  = ['2011', '2012', '2013', '2014', '2015'],
		months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

	var result;
	while (!result || (min && result <= min))
		result = [
			years[Math.floor(years.length * Math.random())],
			months[Math.floor(months.length * Math.random())]
		].join('-');
	return result;
};

function getDates(begin, end) {
	begin = moment(begin, 'YYYY-MM');
	end   = moment(end, 'YYYY-MM');

	var current = begin.clone(),
		cols    = [];

	while (current.isBefore(end) || current.isSame(end)) {
		cols.push(current.format('YYYY-MM'));
		current.add(1, 'month');
	}

	return cols;
};

function makeType() {
	return {
		_id: uuid.v4(),
		type: "type",
		name: lipsum({count: 4, units: 'words'})
	};
};

function makeTheme() {
	return {
		_id: uuid.v4(),
		type: "theme",
		name: lipsum({count: 4, units: 'words'})
	};
};

function makeIndicator(indicators, themes, types) {
	var summableIndicators = indicators.filter(function(ind) { return ind.sumAllowed; });

	var sumAllowed = Math.random() < .5;
	if (summableIndicators.length < 2)
		sumAllowed = true;

	var indicator  = {
		_id: uuid.v4(),
		type: "indicator",
		name: lipsum({count: 10, units: 'words'}),
		description: lipsum({count: 25, units: 'words'}),
		history: lipsum({count: 25, units: 'words'}),
		standard: Math.random() < .4,
		sumAllowed: sumAllowed,
		formulas: {},
		themes: [],
		types: []
	};

	// add one theme and one type.
	indicator.themes.push(themes[Math.floor(themes.length * Math.random())]._id);
	indicator.types.push(types[Math.floor(types.length * Math.random())]._id);

	// if sum is not allowed, add one formula to express it with two other sumable indicators
	if (!sumAllowed) {
		summableIndicators.sort(function(a, b) { return Math.random() - .5; });

		var word1 = lipsum({count: 1, units: 'words'}),
			word2 = lipsum({count: 1, units: 'words'}),
			parameters = {};

		parameters[word1] = summableIndicators[0];
		parameters[word2] = summableIndicators[1];

		indicator.formulas[uuid.v4()] = {
			name: lipsum({count: 5, units: 'words'}),
			expression: '100 * ' + word1 + ' / ' + word2,
			parameters: parameters
		};
	}

	return indicator;
};


function makeProject(indicators) {
	function makePurpose() {
		return {
			description: lipsum({count: 15, units: 'words'}),
			assumptions: lipsum({count: 15, units: 'words'}),
			indicators: [],
			outputs: [
				{
					description: lipsum({count: 15, units: 'words'}),
					assumptions: lipsum({count: 15, units: 'words'}),
					indicators: [],
					activities: [
						{
							description: lipsum({count: 15, units: 'words'}),
							prerequesites: lipsum({count: 15, units: 'words'})
						}
					]
				}
			]
		}
	};

	function makeInputEntity() {
		return {id: uuid.v4(), name: lipsum({count: 4, units: 'words'})};
	};

	function makeInputGroup(entities) {
		var entities = entities.concat();
		entities.sort(function(a, b) { return Math.random() - .5; });

		return {
			id: uuid.v4(),
			name: lipsum({count: 4, units: 'words'}),
			members: entities.splice(0, 4).map(function(e) { return e.id; })
		};
	};

	function addIndicator(project, indicators) {
		// retrieve an indicator that's not already taken
		var indicator;
		while (!indicator || project.indicators[indicator._id])
			indicator = indicators[Math.floor(Math.random() * indicators.length)];

		// make up a reason to collect it.
		project.indicators[indicator._id] = {
			relevance: lipsum({count: 10, units: 'words'}),
			baseline: Math.floor(100 * Math.random()),
			minimum: 0,
			orangeMinimum: 20,
			greenMinimum: 40,
			greenMaximum: 60,
			orangeMaximum: 80,
			maximum: 100,
			targets: []
		};

		project.dataCollection[0].fields[indicator._id] = {
			type: "manual",
			source: lipsum({count: 4, units: 'words'})
		};

		var indicatorsLists = [project.logicalFrame.indicators];
		project.logicalFrame.purposes.forEach(function(purpose) {
			indicatorsLists.push(purpose.indicators);
			purpose.outputs.forEach(function(output) {
				indicatorsLists.push(output.indicators);
			});
		});

		indicatorsLists[Math.floor(indicatorsLists.length * Math.random())].push(indicator._id);
	};

	var begin = randomDate();

	var project = {
		_id: uuid.v4(),
		type: "project",
		name: lipsum({count: 6, units: 'words'}),
		begin: begin,
		end: randomDate(begin),
		logicalFrame: {
			goal: lipsum({count: 15, units: 'words'}),
			indicators: [],
			purposes: []
		},
		inputEntities: [],
		inputGroups: [],
		indicators: {},
		dataCollection: [
			{
				id: uuid.v4(),
				name: lipsum({count: 6, units: 'words'}),
				periodicity: "monthly",
				useProjectStart: true,
				useProjectEnd: true,
				fields: {}
			}
		]
	};

	var i;
	for (i = 0; i < 3; ++i)
		project.logicalFrame.purposes.push(makePurpose());
	for (i = 0; i < 15; ++i)
		project.inputEntities.push(makeInputEntity());
	for (i = 0; i < 15; ++i)
		project.inputGroups.push(makeInputGroup(project.inputEntities));
	for (i = 0; i < 10; ++i)
		addIndicator(project, indicators);

	return project;
}

function makeInputs(project) {
	var inputs = [];

	project.inputEntities.forEach(function(entity) {
		project.dataCollection.forEach(function(form) {
			getDates(project.begin, project.end).forEach(function(period) {
				var indicators = {};
				for (var indicatorId in form.fields)
					indicators[indicatorId] = Math.floor(100 * Math.random());

				inputs.push({
					_id: [project._id, entity.id, form.id, period].join(':'),
					type: "input",
					project: project._id,
					entity: entity.id,
					form: form.id,
					period: period,
					indicators: indicators
				});
			});
		});
	});

	return inputs;
}


var i,
	types  = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(makeType),
	themes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(makeTheme),
	indicators = [],
	projects = [],
	inputs = [];

for (i = 0; i < 500; ++i)
	indicators.push(makeIndicator(indicators, themes, types));
for (i = 0; i < 100; ++i) {
	var project = makeProject(indicators);
	inputs = inputs.concat(makeInputs(project));
	projects.push(project);
}

console.log('This script writes a lot of lipsum garbage into a couchdb monitool database. Run it at your own risks!');
var host = readline.question('host [localhost]: ') || 'localhost',
	port = readline.question('port [5984]: ') || 5984,
	bucket = readline.question('bucket [monitool]: ') || 'monitool',
	auth = {
		user: readline.question('login []: '),
		pass: readline.question('password []: ', {noEchoBack: true})
	};

var docs = types.concat(themes).concat(indicators).concat(projects).concat(inputs);
while (docs.length !== 0) {
	request({
		method: 'POST',
		auth: {user: username, pass: password},
		url: 'http://' + host + ':' + port + '/' + bucket + '/_bulk_docs',
		json: { docs: docs.splice(0, 100) }
	}, function(error, response, doc) {
		if (!error)
			console.log('Written', doc.length, 'documents');
		else
			console.log('Failed to write docs');
	});
}
