
var nano = require('nano'),
	moment = require('moment'),
	uuid = require('node-uuid');


var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD', free: 'YYYY-MM-DD'};

var db = nano('http://localhost:5984').use('monitool-september');

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

			documentsToKeep.push({_id: input._id, _rev: input._rev, _deleted: true});

			input.period = moment.utc(input.period + 'T00:00:00Z').format(formats[periodicity]);
			input._id = [input.project, input.entity, input.form, input.period].join(':');
			delete input._rev;
			documentsToKeep.push(input);
		}
		catch(e) {
			documentsToKeep.push({_id: input._id, _rev: input._rev, _deleted: true});
		}
	}

	// console.log(documentsToKeep.map(JSON.stringify).join("\n\n"));

	db.bulk({docs: documentsToKeep}, function(error, done) {
		console.log(error);
	});

});

