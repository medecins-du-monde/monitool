"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	var db = new PouchDB('monitool');

	db.put({
		_id: '_design/monitool',
		views: {
			by_type: {
				map: function(doc) {
					emit(doc.type);
				}.toString()
			},
			input_by_project: {
				map: function(doc) {
					if (doc.type === 'input')
						emit(doc.project);
				}.toString()
			}
		}
	});

	db.sync('http://localhost:5984/monitool', {live: true});

	return db;
});
