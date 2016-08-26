
var nano = require('nano'),
	moment = require('moment'),
	uuid = require('node-uuid');


var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};

var db = nano('http://localhost:5984').use('monitool-final');

db.list({include_docs: true}, function(error, result) {

	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var documentsToKeep = [];

	var id;

	for (id in documents.input) {
		var input = documents.input[id];

		try {
			var periodicity = documents
				.project[input.project]
				.forms.find(function(f) { return f.id === input.form; })
				.periodicity;

			input.period = moment.utc(input.period + 'T00:00:00Z').format(formats[periodicity]);
		}
		catch(e) {
			console.log('deleting input')
			input._deleted = true;
		}

		documentsToKeep.push(input);
	}

	// console.log(JSON.stringify(documentsToKeep, null, "\t"));

	db.bulk({docs: documentsToKeep}, function(error, done) {
		console.log(error);
	});

});

