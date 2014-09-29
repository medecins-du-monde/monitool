"use strict";

var mtServices = angular.module('MonitoolServices', []);

mtServices.factory('mtDatabase', function($q) {

	return {
		getDatabase: function() {
			var dbDefer     = $q.defer(),
				openRequest = window.indexedDB.open("monitool", 1);

			openRequest.onerror = function(e) {
				dbDefer.reject(e.toString());
			};

			openRequest.onupgradeneeded = function(e) {
				var database = e.target.result;

				var project        = database.createObjectStore("project", { keyPath: "id" }),
					indicator      = database.createObjectStore("indicator", { keyPath: "id" }),
					indicatorTheme = database.createObjectStore("indicator_theme", { keyPath: "id" }),
					indicatorType  = database.createObjectStore("indicator_type", { keyPath: "id" }),
					input          = database.createObjectStore("input", { keyPath: "id" }),
					display        = database.createObjectStore("display", { keyPath: "id" });

				indicator.createIndex("theme_type_idx", ["themeIds", "typeIds"], {unique: false, multiEntry: true});
				indicator.createIndex("type_theme_idx", ["typeIds", "themeIds"], {unique: false, multiEntry: true});
			};

			openRequest.onsuccess = function(e) {
				dbDefer.resolve(e.target.result);
			};

			return dbDefer.promise;
		},

		getProjects: function() {
			return this.getDatabase().then(function(db) {
				var projectsDefer = $q.defer(),
					projects = [];

				db.transaction(['project'], 'readonly').objectStore('project').openCursor().onsuccess = function(event) {
					var cursor = event.target.result;

					if (cursor) {
						projects.push(cursor.value);
						cursor.continue();
					}
					else
						projectsDefer.resolve(projects);
				}

				return projectsDefer.promise;
			});
		},

		getProject: function(id) {
			return this.getDatabase().then(function(db) {
				var projectsDefer = $q.defer(),
					request = db.transaction(['project'], 'readonly').objectStore('project').get(id);

				request.onsuccess = function(event) {
					return project.resolve(request.result);
				};

				request.onerror = function(event) {
					return project.reject(event);
				}

				return projectDefer.promise;
			});
		},

		addProject: function(project) {
			return this.getDatabase().then(function(db) {

			});
		}
	}
});
