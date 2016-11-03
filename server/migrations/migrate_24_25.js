"use strict";

var nano = require('nano');

var old = nano('http://localhost:5984').use('monitool_iraq');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	// Fix user permissions system
	for (id in documents.user) {
		var user = documents.user[id];
		
		if (user.roles) {

			if (user.roles.indexOf('_admin') !== -1)
				user.role = 'admin';
			else if (user.roles.indexOf('project') !== -1)
				user.role = 'project';
			else
				user.role = 'common';

			delete user.roles;

			docsToUpdate.push(user);
		}
	}

	for (id in documents.indicator) {
		var indicator = documents.indicator[id];

		if (indicator.comments) {

			indicator.unit = 'none';
			indicator.description = indicator.comments;

			delete indicator.source;
			delete indicator.comments;
			delete indicator.standard;
			delete indicator.sources;
			delete indicator.operation;
			delete indicator.types;

			docsToUpdate.push(indicator);
		}
	}

	// console.log(docsToUpdate)

	old.bulk({docs: docsToUpdate}, function(error, done) {
		console.log(error);
	});

});

