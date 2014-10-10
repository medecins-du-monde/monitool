
var data = {

	"views": [
		{
			"_id": '_design/monitool',
			"views": {
				"by_type": {
					"map": function(doc) { emit(doc.type); }.toString()
				},

				"inputs_by_project_period_indicator": {
					"map": function(doc) {
						if (doc.type === 'input')
							for (var indicator in doc.indicators)
								emit([doc.project, doc.period, indicator], doc.indicators[indicator]);
					}.toString()
				},

				"inputs_by_center_period_indicator": {
					"map": function(doc) {
						if (doc.type === 'input')
							for (var indicator in doc.indicators)
								emit([doc.center, doc.period, indicator], doc.indicators[indicator]);
					}.toString()
				},

				"inputs_by_indicator_period_project": {
					"map": function(doc) {
						if (doc.type === 'input')
							for (var indicator in doc.indicators)
								emit([indicator, doc.period, doc.project], doc.indicators[indicator]);
					}.toString()
				},

				"project_by_center": {
					"map": function(doc) {
						if (doc.type === 'project')
							for (var centerId in doc.center)
								emit(centerId);
					}.toString()
				},

				"formulas": {
					"map": function(doc) {
						if (doc.type === 'indicator')
							for (var formulaId in doc.formulas)
								emit(formulaId, doc.formulas[formulaId]);
					}.toString()
				}
			}
		}
	],

	"project": [
		{
			"_id": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
			"type": "project",
			"name": "Projet number 1",
			"country": "RDC",

			"planning": {
				"7003ff8b-4335-4682-9c48-82eb2320dfd2": {
					"periodicity": "month",
					"from": "2014-01",
					"to": "2015-01",
					"formula": "4d34b83b-586e-4316-802a-50bf7bcd0304"
				},
				"1c38fa28-1dc2-449e-aa34-08aa3b773e3b": {
					"periodicity": "month",
					"from": "2014-01",
					"to": "2015-01",
					"formula": "3ddfd5dd-48b1-44c4-8809-f163bb9e1150"	
				}
			},

			"center": {
				"cc5943d0-8e22-488c-b998-bd942cbc1252": {
					"name": "CASO Paris Saint Lazare",
					"latitude": 12,
					"longitude": 10
				},
				"f0cb620a-8680-44ed-ab82-5c5816e40ab7": {
					"name": "CASO Marseille Nord",
					"latitude": 12,
					"longitude": 10
				},
				"19e8ca24-4b31-46f4-af7d-ffc322157909": {
					"name": "CASO Quimper",
					"latitude": 12,
					"longitude": 10
				},
			}
		}
	],

	"indicators": [
		{
			"_id": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
			"type": "indicator",
			"name": "Nombre de partogrammes correctement renseignés",
			"space_agg": true,
			"time_agg": true,
			"formulas": []
		},
		{
			"_id": "4741ada6-709a-4a19-913e-ea174f053bbb",
			"type": "indicator",
			"name": "Nombre de partogrammes renseignés",
			"space_agg": true,
			"time_agg": true,
			"formulas": []
		},
		{
			"_id": "7003ff8b-4335-4682-9c48-82eb2320dfd2",
			"type": "indicator",
			"name": "Pourcentage des partogramme correctement renseignés",
			"space_agg": false,
			"time_agg": false,
			"formulas": {
				"4d34b83b-586e-4316-802a-50bf7bcd0304": {
					"name": "Percentage",
					"expression": "100 * a / b",
					"parameters": {
						"a": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
						"b": "4741ada6-709a-4a19-913e-ea174f053bbb"
					}
				}
			}
		},
		{
			"_id": "1c38fa28-1dc2-449e-aa34-08aa3b773e3b",
			"type": "indicator",
			"name": "Double du % des partogramme correctement renseignés",
			"space_agg": true,
			"time_agg": true,
			"formulas": {
				"3ddfd5dd-48b1-44c4-8809-f163bb9e1150": {
					"name": "Double du %",
					"expression": "2 * a",
					"parameters": {
						"a": "7003ff8b-4335-4682-9c48-82eb2320dfd2"
					}
				},
				"4a7be146-4aa7-4925-93d0-f819bec11bba": {
					"name": "Calcul avec les donnees de base",
					"expression": "200 * a / b",
					"parameters": {
						"a": "8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f",
						"b": "4741ada6-709a-4a19-913e-ea174f053bbb"
					}
				}
			}
		}
	],

	"input": [
		// {
		// 	"_id": "77bc9228-56c8-4895-8627-4c93fa7f56ec",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "cc5943d0-8e22-488c-b998-bd942cbc1252",
		// 	"period": "2014-01",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 45,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 12
		// 	}
		// },
		// {
		// 	"_id": "e04421ce-d059-409a-930a-f41ef455f4a7",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "f0cb620a-8680-44ed-ab82-5c5816e40ab7",
		// 	"period": "2014-01",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 45,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 12
		// 	}
		// },
		// {
		// 	"_id": "9d8cf2fa-c4e5-4547-9abe-39144640527e",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "19e8ca24-4b31-46f4-af7d-ffc322157909",
		// 	"period": "2014-01",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 45,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 12
		// 	}
		// },
		// {
		// 	"_id": "16ce2045-ed16-4f66-8a7b-a76aa8bfdbcb",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "cc5943d0-8e22-488c-b998-bd942cbc1252",
		// 	"period": "2014-02",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 51,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 9
		// 	}
		// },
		// {
		// 	"_id": "1fbb7e81-ddfb-4e45-8772-d3bd22b16596",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "f0cb620a-8680-44ed-ab82-5c5816e40ab7",
		// 	"period": "2014-02",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 45,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 12
		// 	}
		// },
		// {
		// 	"_id": "fa5c98fa-8683-4851-8d9e-56b9ebd11f9c",
		// 	"type": "input",
		// 	"project": "c50da7f0-30d3-4cce-ada5-ab6294cf65c6",
		// 	"center": "19e8ca24-4b31-46f4-af7d-ffc322157909",
		// 	"period": "2014-02",
		// 	"indicators": {
		// 		"8bafe57e-1c1d-4a7e-bf9f-fbd2a27c4b0f": 45,
		// 		"4741ada6-709a-4a19-913e-ea174f053bbb": 12
		// 	}
		// }
	]
}

var request = require('request');


for (var type in data) {
	data[type].forEach(function(doc) {
		request.put('http://localhost:5984/monitool/' + doc._id, {json: doc}, function(error, response, body) {
			console.log(body)
		});
	})
}

