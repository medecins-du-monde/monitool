/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

// https://gist.github.com/darlanalves/5b0865b7e3c8e3b00b67

angular.module('monitool.filters.shared', [])

	.filter('length', function() {
		return function(obj) {
			return obj ? Object.keys(obj).length : 0;
		};
	})

	.filter('isEmpty', function() {
		return function(obj) {
			return Object.keys(obj).length == 0;
		};
	})

	.filter('unsafe', function($sce) {
		return $sce.trustAsHtml;
	})

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
		};
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

	.filter('maxLength', function() {
		return function(string, size) {
			if (!string)
				return string;

			if (string.length > size)
				return string.slice(0, size - 3) + '...';
			else
				return string;
		};
	})