"use strict";

var dbServices = angular.module('monitool.services.database', ['pouchdb']);

dbServices.factory('mtDatabase', function(PouchDB) {
	var local  = new PouchDB(LOCAL_DB),
		remote = new PouchDB(REMOTE_DB, {skipSetup: true, adapter: 'http', ajax: {cache: true}});

	return {
		current: remote,
		local: local,
		remote: remote
	};
});




// mtServices.factory('mtStatus', function($q, mtDatabase) {

// 	var fsm = StateMachine.create({
// 		initial: "Init",
// 		states: [
// 			"Init",

// 			"OfflineFail",
// 			"OnlineOnly",
// 			"InitialSync",
// 			"Synced",

// 			"ProjectDownload",
// 			"Offline",
// 			"Resync",
// 			"Conflicted"
// 		],
// 		events: [
// 			{ name: "initFail", from: "Init", to: "OfflineFail"},
// 			{ name: "initOffline", from: "Init", to: "Offline"},
// 			{ name: "initOnline", from: "Init", to: "OnlineOnly"},
// 			{ name: "initResync", from: "Init", to: "Resync"},

// 			{ name: "dirtyConnect", from: "OfflineFail", to: "OnlineOnly" },
// 			{ name: "enableOffline", from: "OnlineOnly", to: "InitialSync" },
// 			{ name: "dirtyDisconnect", from: ["InitialSync", "OnlineOnly"], to: "OfflineFail" },

// 			{ name: "initialSyncDone", from: "InitialSync", to: "Synced" },
// 			{ name: "addProject", from: "Synced", to: "ProjectDownload" },
// 			{ name: "addProjectDone", from: "ProjectDownload", to: "Synced" },
// 			{ name: "cleanDisconnect", from: ["Synced", "ProjectDownload"], to: "Offline"},

// 			{ name: "cleanConnect", from: "Offline", to: "Resync"},
// 			{ name: "resyncDone", from: "Resync", to: "Synced"},
// 			{ name: "resyncConflict", from: "Resync", to: "Conflicted"},
// 			{ name: "conflictResolve", from: "Conflicted", to: "Synced"},
// 		],
// 		callbacks: {
// 			onenterOfflineFail: function() {
// 				// // check every second if we can connect
// 				// var checkConnectivity = function() {
// 				// 	return mtDatabase.remote.info()
// 				// 		.then(function(info) {
// 				// 			fsm.dirtyConnect();
// 				// 		})
// 				// 		.catch(function(error) {
// 				// 			setTimeout(checkConnectivity, 1000);
// 				// 			return false;
// 				// 		});
// 				// };

// 				// checkConnectivity();
// 			},

// 			onenterOnlineOnly: function() {
// 				mtDatabase.current = mtDatabase.remote;
// 				// start up application!!
// 			},

// 			onenterInitialSync: function() {
// 				mtDatabase.local.put({_id: '_local/projects', projects: []}).then(function() {
// 					var replication = PouchDB.replicate(REMOTE_DB, LOCAL_DB, {filter: "monitool/offline"})
// 						// destroy local database and disconnect if the replication fails.
// 						// we could try to resume as it should work but well...
// 						.on('error', function() {
// 							PouchDB.destroy(LOCAL_DB);
// 							mtDatabase.local = new PouchDB(LOCAL_DB);
// 							fsm.dirtyDisconnect();
// 							console.log('fail')
// 						})

// 						// if the replication worked, we are done
// 						.on('complete', function() {
// 							mtDatabase.local.put({_id: '_local/status'}).then(function() {
// 								fsm.initialSyncDone();
// 							});
// 						});
// 				})
// 			},

// 			onenterSynced: function() {
// 				mtDatabase.local.get('_local/projects').then(function(projectIds) {
// 					var repOptions = {live: true, filter: "monitool/offline", queryParams: {projects: projectIds}};

// 					PouchDB.replicate(REMOTE_DB, LOCAL_DB, repOptions)
// 						// when there is a replication error, assume that we have disconnected
// 						.on('error', function(error) {
// 							fsm.cleanDisconnect();
// 							mtDatabase.current = mtDatabase.local;
// 						});
// 				});
// 			},

// 			onenterProjectDownload: function() {

// 			},

// 			onenterOffline: function() {
// 				mtDatabase.current = mtDatabase.local;
// 			},

// 			onenterResync: function() {

// 			},

// 			onenterConflicted: function() {

// 			},

// 		}
// 	});

// 	return fsm;
// });

