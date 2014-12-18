"use strict";

angular
	.module('monitool.services.database', ['pouchdb'])
	.factory('mtDatabase', function(PouchDB) {
		var USERS_DB = REMOTE_DB.substring(0, REMOTE_DB.lastIndexOf('/') + 1) + '_users',
			remote   = new PouchDB(REMOTE_DB, {skipSetup: true, adapter: 'http', ajax: {cache: true}}),
			user     = new PouchDB(USERS_DB, {skipSetup: true, adapter: 'http', ajax: {cache: true}});

		return {current: remote, remote: remote, user: user};
	});
