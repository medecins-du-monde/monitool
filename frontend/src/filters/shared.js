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

	.filter('formatUser', function() {
		return function(user) {
			if (user)
				return user.substring(user.indexOf(':') + 1);
		};
	})

	.filter('humanizePatch', function($sce, $filter) {


		/**
		 * There are a big number of possible things that can be edited in a project.
		 * To avoid having to write a translation string for each one of them, we don't go into too much details for
		 * the rarest modification.
		 *
		 * This function creates a translation string with the appropriate level of detail depending on
		 * the change that was done.
		 *
		 * For instance:
		 *     '/start', 'replace' => 'start_replace'
		 *     '/logicalFrames/0/purposes/0/ouputs/4/activities/2/indicators', 'add' => 'logicalFrames_indicators_add'
		 *     '/crossCutting/indicator:9fa37bfc-309d-455c-9b26-13506527e355', 'add' => 'crossCutting_add'
		 */
		var getTranslationKey = function(operation) {
			// Start by removing indexes, and replacing / by _
			var edited_field = operation.path
				// Remove leading slash
				.substring(1)

				// Remove indexes and ids that are in the middle
				// i.e. "logicalFrames/0/purposes" to "logicalFrames_purposes"
				// i.e. "crossCutting/indicator:85555adc-285e-494a-bfc7-69debd9a6a6e/target" to "crossCutting_target"
				.replace(/\/\d+\//g, '_')
				.replace(/\/[a-z]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//, '_')

				// Remove trailing numbers and trailing uuids
				// i.e. "themes/4" to "themes"
				// i.e. "crossCutting/indicator:85555adc-285e-494a-bfc7-69debd9a6a6e" to "crossCutting"
				.replace(/\/\d+$/, '')
				.replace(/\/[a-z]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, '')

			// Special case for indicators: we do as if all logframe indicators were on the general objective.
			var indicatorMatch = edited_field.match(/^logicalFrames.*indicators(.*)$/);
			if (indicatorMatch)
				edited_field = 'logicalFrames_indicators' + indicatorMatch[1];

			// All computation changes in indicators are simplified to be complete replacement.
			var computationMatch = edited_field.match('^(.*)_computation');
			if (computationMatch) {
				// truncate everything after computation
				edited_field = computationMatch[1] + '_computation';
				edited_field = edited_field + '_replace';
			}
			else {
				edited_field = edited_field + '_' + operation.op;
			}

			return 'project.history.' + edited_field;
		};

		/**
		 * Get data object to feed the translations
		 */
		var getTranslationData = function(operation, before, after) {
			var edited_field = operation.path.substring(1).replace(/\/\d+\//g, '_').replace(/\/\d+$/, ''),
				splpath = operation.path.split('/').slice(1),
				translation_data = {};

			//////////////////////////
			// Start by traversing the whole before object, and saving everything that we find in the way
			// i.e. if we are modifying a partition name, we will save the data source, the variable, and the partition.
			//////////////////////////

			var currentItem = before;
			for (var j = 1; j < splpath.length - 1; j += 2) {
				var name = splpath[j - 1], id = splpath[j];

				currentItem = currentItem[name][id];

				if (name === 'entities') // This is just to avoid writing "entitie" in the translation strings
					name = 'entity';
				else if (name === 'elements' && j < 5) // Avoid name collision between form and partition elements
					name = 'variable';
				else // we can have the singular by removing the trailing 's' (i.e. logicalFrames => logicalFrame)
					name = name.substring(0, name.length - 1);

				translation_data[name] = currentItem;
			}

			//////////////////////////
			// For certain particular cases, the previous step was not enough, because the modification in the project
			// was in an opaque reference.
			// For instance, adding a site to a datasource will only add an id.
			// => We need to have the name of the entity.
			//
			// This piece of code takes care of all the special cases.
			//////////////////////////

			if (operation.op === 'add') {
				translation_data.item = operation.value;

				// it's an entity => return the entity
				if (edited_field === 'groups_members' || edited_field === 'forms_entities')
					translation_data.item = before.entities.find(function(e) { return e.id === translation_data.item; });

				if (edited_field === 'forms_elements_partitions_groups_members')
					translation_data.item = translation_data.partition.elements.find(function(e) {return e.id == translation_data.item; });
			}
			else if (operation.op === 'replace') {
				translation_data.after = operation.value;
				translation_data.before = before;
				for (var j = 0; j < splpath.length; j += 1)
					translation_data.before = translation_data.before[splpath[j]];

				if (edited_field === 'groups_members' || edited_field === 'forms_entities') {
					translation_data.before = before.entities.find(function(e) { return e.id === translation_data.before; });
					translation_data.after = before.entities.find(function(e) { return e.id === translation_data.after; });
				}

				if (edited_field === 'forms_elements_partitions_groups_members') {
					translation_data.before = translation_data.partition.elements.find(function(e) {return e.id == translation_data.before; });
					translation_data.after = translation_data.partition.elements.find(function(e) {return e.id == translation_data.after; });
				}
			}
			else if (operation.op === 'remove') {
				translation_data.item = before;
				for (var j = 0; j < splpath.length; j += 1)
					translation_data.item = translation_data.item[splpath[j]];

				if (edited_field === 'groups_members' || edited_field === 'forms_entities')
					translation_data.item = before.entities.find(function(e) { return e.id === translation_data.item; });

				if (edited_field === 'forms_elements_partitions_groups_members')
					translation_data.item = translation_data.partition.elements.find(function(e) {return e.id == translation_data.item; });
			}
			else if (operation.op === 'move') {
				translation_data.item = before;

				var splpath2 = operation.from.split('/').slice(1);
				for (var j = 0; j < splpath2.length; j += 1)
					translation_data.item = translation_data.item[splpath2[j]];
			}

			return translation_data;
		};

		var translate = $filter('translate');

		return function(patch) {
			var before = jsonpatch.deepClone(patch.before),
				after  = jsonpatch.deepClone(patch.before);

			var humanizedPatches = [];

			for (var i = 0; i < patch.forwards.length; ++i) {
				var operation = patch.forwards[i];

				after = jsonpatch.applyOperation(after, operation).newDocument;

				var str = translate(
					getTranslationKey(operation),
					getTranslationData(operation, before, after)
				);

				if (humanizedPatches.indexOf(str) === -1)
					humanizedPatches.push(str);

				before = jsonpatch.applyOperation(before, operation).newDocument;
			}

			return $sce.trustAsHtml('<ul><li>' + humanizedPatches.join('</li><li>') + '</li></ul>');
		};
	});
