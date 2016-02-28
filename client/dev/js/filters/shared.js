"use strict";

// https://gist.github.com/darlanalves/5b0865b7e3c8e3b00b67

angular.module('monitool.filters.shared', [])

	.filter('translate_list', function($filter) {
		return function(items) {
			return items.map(function(i) {
				return $filter('translate')(i);
			});
		};
	})

	.filter('join', function() {
		return function(list, token) {
			return (list||[]).join(token);
		}
	})

	.filter('pluck', function() {
		function pluck(objects, property) {
			if (!(objects && property && angular.isArray(objects)))
				return [];

			property = String(property);
			
			return objects.map(function(object) {
				// just in case
				object = Object(object);
				
				if (object.hasOwnProperty(property)) {
					return object[property];
				}
				
				return '';
			});
		}
		
		return function(objects, property) {
			return pluck(objects, property);
		}
	})

	.filter('getObjects', function() {
		return function(ids, objects) {
			objects = objects || {};
			ids = ids || [];

			var objectsById = {};
			for (var key in objects) {
				var obj = objects[key];
				objectsById[obj.id || obj._id] = obj;
			}

			return ids.map(function(id) { return objectsById[id]; });
		}
	})

	.filter('nl2br', function() {
		return function(str) {
			return str.replace(/\n/g, "<br/>");
		};
	})

	