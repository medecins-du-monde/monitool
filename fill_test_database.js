
var data = {



	"views": [
		{
			"_id": '_design/monitool',

			// "shows": {
			// 	"project": function(doc, req) {
			// 		return doc.name + ' is a capital project for our goal!';
			// 	}.toString()
			// },

			// "lists": {
			// 	"by_type": function(head, req) {
			// 		var row;
			// 		while (row = getRow())
			// 			if (row.value)
			// 				send(row.value.name + "\n");
			// 	}.toString()
			// },

			// "updates": {

			// 	"make_stupid": function(doc, req) {
			// 		doc.name = 'Stupid ' + doc.name;
			// 		return [doc, toJSON(doc)];
			// 	}.toString(),

			// },

			"filters": {
				"offline": function(doc, request) {
					if (doc.type === 'type' || doc.type === 'theme' || doc.type === 'indicator')
						return true;
					else if (request.query.projects) {
						try {
							var ids = JSON.parse(request.query.projects);
							if (doc.type === 'project')
								return request.query.projects.indexOf(doc._id);
							else if (doc.type === 'input')
								return request.query.projects.indexOf(doc.project);
							else
								return false;
						}
						catch (e) {
							return false;
						}
					}
					else
						return false;
				}.toString()
			},

			"views": {

				"projects_short": {
					"map": function(doc) {
						if (doc.type === 'project')
							emit(doc._id, {name: doc.name, begin: doc.begin, end: doc.end});
					}.toString()
				},

				"indicators_short": {
					"map": function(doc) {
						if (doc.type === 'project') {
							var main = {}, dependency = {}, indicatorId = null;

							for (indicatorId in doc.indicators)
								main[indicatorId] = true;

							var numForms = doc.dataCollection.length;
							for (var i = 0; i < numForms; ++i)
								for (indicatorId in doc.dataCollection[i].fields)
									if (!main[indicatorId])
										dependency[indicatorId] = true;

							for (indicatorId in main)
								emit(indicatorId, {main: 1});

							for (indicatorId in dependency)
								emit(indicatorId, {dependency: 1});
						}
						else if (doc.type === 'indicator')
							emit(doc._id, {name: doc.name, standart: doc.standart, types: doc.types, themes: doc.themes});

						// this may be a bit overkill
						else if (doc.type === 'input')
							for (var indicatorId in doc.indicators)
								emit(indicatorId, {input: 1});
					}.toString(),

					"reduce": function(keys, values, rereduce) {
						var memo      = {main: 0, dependency: 0, input: 0},
							numValues = values.length;

						for (var i = 0; i < numValues; ++i) {
							var value = values[i];

							if (value.name) {
								memo.name     = value.name
								memo.standart = value.standart
								memo.types    = value.types
								memo.themes   = value.themes
							}

							value.main       && (memo.main       += value.main);
							value.dependency && (memo.dependency += value.dependency);
							value.input      && (memo.input      += value.input);
						}

						return memo;
					}.toString()
				},

				// For statistics consultation
				"inputs_by_project_year_month_entity": {
					"map": function(doc) {
						if (doc.type === 'input') {
							var p = doc.period.split('-');
							emit([doc.project, p[0], p[1], doc.entity], doc.indicators);
						}
					}.toString(),

					"reduce": function(keys, values, rereduce) {
						var memo = {}, numValues = values.length;
						for (var i = 0; i < numValues; ++i) {
							var value = values[i];
							for (var key in value)
								if (memo[key])
									memo[key] += value[key];
								else
									memo[key] = value[key];
						}
						return memo;
					}.toString()
				},

				'inputs_by_entity_year_month': {
					"map": function(doc) {
						if (doc.type === 'input') {
							var p = doc.period.split('-');
							emit([doc.entity, p[0], p[1]], doc.indicators);
						}
					}.toString(),

					"reduce": function(keys, values, rereduce) {
						var memo = {}, numValues = values.length;
						for (var i = 0; i < numValues; ++i) {
							var value = values[i];
							for (var key in value)
								if (memo[key])
									memo[key] += value[key];
								else
									memo[key] = value[key];
						}
						return memo;
					}.toString()
				},

				"types_short": {
					"map": function(doc) {
						if (doc.type === 'indicator')
							doc.types.forEach(function(typeId) {
								emit(typeId, {usage: 1});
							});
						
						else if (doc.type === 'type')
							emit(doc._id, {name: doc.name});

					}.toString(),

					"reduce": function(keys, values, rereduce) {
						var memo      = {usage: 0},
							numValues = values.length;

						for (var i = 0; i < numValues; ++i) {
							var value = values[i];

							if (value.usage)
								memo.usage += value.usage;

							if (value.name)
								memo.name = value.name
						}

						return memo;
					}.toString()
				},

				"themes_short": {
					"map": function(doc) {
						if (doc.type === 'indicator')
							doc.themes.forEach(function(themeId) {
								emit(themeId, {usage: 1});
							});
						else if (doc.type === 'theme')
							emit(doc._id, {name: doc.name});
					}.toString(),

					"reduce": function(keys, values, rereduce) {
						var memo      = {usage: 0},
							numValues = values.length;

						for (var i = 0; i < numValues; ++i) {
							var value = values[i];

							if (value.usage)
								memo.usage += value.usage;

							if (value.name)
								memo.name = value.name;
						}

						return memo;
					}.toString()
				}
			}
		}
	],

	// "project": [
	// 	{
	// 		"_id": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
	// 		"type": "project",
	// 		"name": "Projet number 1",
	// 		"country": "RDC",

	// 		"planning": {
	// 			"7003ff8b-4335-4682-9c48-82eb2320dfd2": {
	// 				"periodicity": "month",
	// 				"from": "2014-01",
	// 				"to": "2015-01",
	// 				"formula": "4d34b83b-586e-4316-802a-50bf7bcd0304"
	// 			},
	// 			"1c38fa28-1dc2-449e-aa34-08aa3b773e3b": {
	// 				"periodicity": "month",
	// 				"from": "2014-01",
	// 				"to": "2015-01",
	// 				"formula": "3ddfd5dd-48b1-44c4-8809-f163bb9e1150"	
	// 			}
	// 		},

	// 		"center": {
	// 			"cc5943d0-8e22-488c-b998-bd942cbc1252": {
	// 				"name": "CASO Paris Saint Lazare",
	// 				"latitude": 12,
	// 				"longitude": 10
	// 			},
	// 			"f0cb620a-8680-44ed-ab82-5c5816e40ab7": {
	// 				"name": "CASO Marseille Nord",
	// 				"latitude": 12,
	// 				"longitude": 10
	// 			},
	// 			"19e8ca24-4b31-46f4-af7d-ffc322157909": {
	// 				"name": "CASO Quimper",
	// 				"latitude": 12,
	// 				"longitude": 10
	// 			},
	// 		}
	// 	}
	// ],

	// "indicators": [
	// 	// types
	// 	{"_id": "154d03d8-ae56-431f-8858-2a469dfc138a", "type": "type","name": "Dénominateur"},
	// 	{"_id": "41be51fb-37a0-46af-b2a4-d49f6dc9a430", "type": "type","name": "Donnée de base"},
	// 	{"_id": "92998f60-b9e2-4e82-9380-13efe60524d1", "type": "type","name": "Prévalence"},
	// 	{"_id": "9642825d-8d02-4044-bd40-ec9171e40b5c", "type": "type","name": "Indicateur infrastructure"},
	// 	{"_id": "c140df25-f31b-40bb-9f2b-54afb8f55e10", "type": "type","name": "Indicateur formation"},
	// 	{"_id": "1c3a3941-76ba-4017-8a16-ec7d7e323e63", "type": "type","name": "Indicateur médical"},

	// 	// themes
	// 	{"_id": "588dec94-a3f3-4a0f-b986-192fb1c6ea33", "type": "theme", "name": "Réduction des risques"},
	// 	{"_id": "82490fd3-1413-4281-ae8c-c40e7f3b5d0d", "type": "theme", "name": "Soins de santé primaires"},
	// 	{"_id": "976801fe-4947-49e8-8547-e2920d85d42a", "type": "theme", "name": "Santé Sexuelle et reproductive"},
	// 	{"_id": "cb0835a5-7cbb-4a29-a2b1-eea18fe699d1", "type": "theme", "name": "Santé Mentale"},
	// 	{"_id": "1c881468-3b01-4c9f-af18-54df0f2a9733", "type": "theme", "name": "Transversal"},
	// 	{"_id": "78721072-16ae-49e0-86cd-a6e4c0aacd17", "type": "theme", "name": "Urgences, Crises"},

	// 	// Indicators
	// 	{
	// 		"_id": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
	// 		"type": "indicator",
	// 		"themes": ["976801fe-4947-49e8-8547-e2920d85d42a"],
	// 		"types": ["41be51fb-37a0-46af-b2a4-d49f6dc9a430"],
	// 		"name": "Nombre de partogrammes correctement renseignés",
	// 		"space_agg": true,
	// 		"time_agg": true,
	// 		"formulas": []
	// 	},
	// 	{
	// 		"_id": "4741ada6-709a-4a19-913e-ea174f053bbb",
	// 		"type": "indicator",
	// 		"themes": ["976801fe-4947-49e8-8547-e2920d85d42a"],
	// 		"types": ["41be51fb-37a0-46af-b2a4-d49f6dc9a430"],
	// 		"name": "Nombre de partogrammes renseignés",
	// 		"space_agg": true,
	// 		"time_agg": true,
	// 		"formulas": []
	// 	},
	// 	{
	// 		"_id": "7003ff8b-4335-4682-9c48-82eb2320dfd2",
	// 		"type": "indicator",
	// 		"themes": ["976801fe-4947-49e8-8547-e2920d85d42a"],
	// 		"types": ["c140df25-f31b-40bb-9f2b-54afb8f55e10"],
	// 		"name": "Pourcentage des partogramme correctement renseignés",
	// 		"space_agg": false,
	// 		"time_agg": false,
	// 		"formulas": {
	// 			"4d34b83b-586e-4316-802a-50bf7bcd0304": {
	// 				"name": "Percentage",
	// 				"expression": "100 * a / b",
	// 				"parameters": {
	// 					"a": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
	// 					"b": "4741ada6-709a-4a19-913e-ea174f053bbb"
	// 				}
	// 			}
	// 		}
	// 	},
	// 	{
	// 		"_id": "1c38fa28-1dc2-449e-aa34-08aa3b773e3b",
	// 		"type": "indicator",
	// 		"name": "Double du % des partogramme correctement renseignés",
	// 		"themes": ["976801fe-4947-49e8-8547-e2920d85d42a"],
	// 		"types": ["c140df25-f31b-40bb-9f2b-54afb8f55e10"],
	// 		"space_agg": true,
	// 		"time_agg": true,
	// 		"formulas": {
	// 			"3ddfd5dd-48b1-44c4-8809-f163bb9e1150": {
	// 				"name": "Double du %",
	// 				"expression": "2 * a",
	// 				"parameters": {
	// 					"a": "7003ff8b-4335-4682-9c48-82eb2320dfd2"
	// 				}
	// 			},
	// 			"4a7be146-4aa7-4925-93d0-f819bec11bba": {
	// 				"name": "Calcul avec les donnees de base",
	// 				"expression": "200 * a / b",
	// 				"parameters": {
	// 					"a": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
	// 					"b": "4741ada6-709a-4a19-913e-ea174f053bbb"
	// 				}
	// 			}
	// 		}
	// 	}
	// ],

	// "input": [

	// ]
}

var request = require('request');


for (var type in data) {
	data[type].forEach(function(doc) {
		request.put('http://localhost:5984/monitool/' + doc._id, {json: doc, auth: {user: '***REMOVED***', pass: '***REMOVED***'}}, function(error, response, body) {
			console.log(body)
		});
	})
}
