"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	var db = new PouchDB('monitool');

	db.get('_design/monitool').catch(function(error) {
		console.log('creating view.');
		db.put({
			_id: '_design/monitool',
			views: {
				by_type: {
					map: function(doc) { emit(doc.type); }.toString()
				}
			}
		});
	});


	db.sync('http://localhost:5984/monitool', {live: true});
	return db;
});
