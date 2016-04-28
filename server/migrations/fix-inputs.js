"use strict";

var nano = require('nano');

var old = nano('http://rgilliotte:33h7hwe9@monitool-couch.cloudapp.net:5984').use('monitool_new');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	// fix inputs
	for (id in documents.input) {
		var input = documents.input[id];

		var project = documents.project[input.project];
		if (!project) {
			console.log('Found input with no project', input._id);
			continue;
		}

		var form = project.forms.filter(function(f) { return f.id == input.form; })[0];
		if (!form) {
			console.log('Found input with no form', input._id);
			continue;
		}

		var newValues = {},
			needUpdate = false;

		form.elements.forEach(function(element) {
			var length = 1;

			element.partitions.forEach(function(partition) {
				// console.log(partition)
				length *= partition.elements.length;
			});

			if (input.values[element.id] && input.values[element.id].length == length)
				newValues[element.id] = input.values[element.id];

			else if (!input.values[element.id]) {
				console.log('missing variable', input._id);

				newValues[element.id] = [];
				for (var i = 0; i < length; ++i)
					newValues[element.id].push(0);

				needUpdate = true;
			}
			else {
				console.log('wrong length', input.values[element.id].length, ' instead of ', length);

				newValues[element.id] = [];
				for (var i = 0; i < length; ++i)
					newValues[element.id].push(0);

				needUpdate = true;
			}
		});

		if (!needUpdate && Object.keys(newValues).length < Object.keys(input.values).length) {
			needUpdate = true;
			console.log('additional variables', input._id)
		}

		if (needUpdate) {
			// console.log(input)
			
			input.values = newValues;
			docsToUpdate.push(input);

			// console.log(input)
			// return;
		}

	}

	console.log(docsToUpdate.length)


	// old.bulk({docs: docsToUpdate}, function(error, done) {
	// 	console.log(error);
	// });

});

