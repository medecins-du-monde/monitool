"use strict";

var database = require('../database');

module.exports = {
	list: function(type, options, callback) {
		options = options || {};

		if (options.ids) {
			options.ids = Array.isArray(options.ids) ? options.ids : [options.ids];
			database.list({keys: options.ids, include_docs: true}, function(error, data) {
				callback(null, data.rows.map(function(row) { return row.doc; }));
			});
		}
		else
			database.view('shortlists', 'by_type', {include_docs: true, key: type}, function(error, data) {
				callback(null, data.rows.map(function(row) { return row.doc; }));
			});
	},

	get: function(type, id, callback) {
		database.get(id, function(error, data) {
			if (error)
				return callback('not_found');

			if (data.type !== type)
				return callback('wrong_type');

			return callback(null, data);
		})
	},

	delete: function(type, id, callback) {
		database.get(id, function(error, document) {
			if (error)
				return callback('Not found');

			if (document.type !== type)
				return callback('Wrong type');

			database.view('server', 'reverse_dependencies', {group: true, key: id}, function(error, data) {
				var usage = data.rows.length ? data.rows[0].value : 0;

				if (usage === 0)
					return database.destroy(id, document._rev, callback);
				else
					return callback('Can\'t delete, the document is used elsewhere')
			});
		});
	},

	set: function(data, callback) {
		database.insert(data, function(error, result) {
			callback(error, result);
		});
	},

	// check that all referenced ids listed in the input hash exist
	// idsByType = {project: ["4839bd1c-0891-4e0d-bd15-2192ac0d08b1"], indicator: ["b4ebe93f-2721-4eb1-9f44-740f7e57295c"]}
	_checkIds: function(idsByType, callback) {
		var ids = [];
		for (var type in idsByType)
			ids = ids.concat(idsByType[type]);

		database.list({keys: ids, include_docs: true}, function(error, result) {
			var errors = [];

			for (var type in idsByType)
				idsByType[type].forEach(function(itemId) {
					var matchs = result.rows.filter(function(row) { return row.id === itemId; });

					if (matchs.length == 0)
						errors.push({field: 'dependency', message: itemId + " is unknown."});
					else if (matchs[0].doc.type !== type)
						errors.push({field: 'dependency', message: itemId + " is of the wrong type."});
				});

			callback(errors);
		});
	},

};
