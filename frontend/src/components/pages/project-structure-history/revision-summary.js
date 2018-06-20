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

import angular from 'angular';
import jsonpatch from 'fast-json-patch';

const module = angular.module(
	'monitool.components.pages.project.structure.history.revision-summary',
	[
	]
);



module.component('revisionSummary', {
	bindings: {
		'revision': '<'
	},
	template: require('./revision-summary.html'),
	controller: class RevisionSummaryController {

		constructor($filter, $sce) {
			this.translate = $filter('translate');
			this.$sce = $sce;
		}

		$onChanges(changes) {
			var before = jsonpatch.deepClone(this.revision.before),
				after  = jsonpatch.deepClone(this.revision.before);

			this.patches = [];

			for (var i = 0; i < this.revision.forwards.length; ++i) {
				var operation = this.revision.forwards[i];

				after = jsonpatch.applyOperation(after, operation).newDocument;

				var str = this.translate(
					this._getTranslationKey(operation),
					this._getTranslationData(operation, before, after)
				);

				if (!this.patches.includes(str))
					this.patches.push(str);

				before = jsonpatch.applyOperation(before, operation).newDocument;
			}

			// FIXME: this may allow a XSS attack on co-owners of the project.
			this.patches = this.patches.map(p => this.$sce.trustAsHtml(p));
		}

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
		_getTranslationKey(operation) {
			// Start by removing indexes, and replacing / by _
			var editedField = operation.path
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
			var indicatorMatch = editedField.match(/^logicalFrames.*indicators(.*)$/);
			if (indicatorMatch)
				editedField = 'logicalFrames_indicators' + indicatorMatch[1];

			// All computation changes in indicators are simplified to be complete replacement.
			var computationMatch = editedField.match('^(.*)_computation');
			if (computationMatch) {
				// truncate everything after computation
				editedField = computationMatch[1] + '_computation';
				editedField = editedField + '_replace';
			}
			else {
				editedField = editedField + '_' + operation.op;
			}

			return 'project.history.' + editedField;
		}

		/**
		 * Get data object to feed the translations
		 */
		_getTranslationData(operation, before, after) {
			var editedField = operation.path.substring(1).replace(/\/\d+\//g, '_').replace(/\/\d+$/, ''),
				splPath = operation.path.split('/').slice(1),
				translationData = {};

			//////////////////////////
			// Start by traversing the whole before object, and saving everything that we find in the way
			// i.e. if we are modifying a partition name, we will save the data source, the variable, and the partition.
			//////////////////////////

			var currentItem = before;
			for (var j = 1; j < splPath.length - 1; j += 2) {
				var name = splPath[j - 1], id = splPath[j];

				currentItem = currentItem[name][id];

				if (name === 'entities') // This is just to avoid writing "entitie" in the translation strings
					name = 'entity';
				else if (name === 'elements' && j < 5) // Avoid name collision between form and partition elements
					name = 'variable';
				else // we can have the singular by removing the trailing 's' (i.e. logicalFrames => logicalFrame)
					name = name.substring(0, name.length - 1);

				translationData[name] = currentItem;
			}

			//////////////////////////
			// Get the actual item that got modified.
			// For replace operations, we define both the "before" and "after" keys
			// Otherwise, just the "item".
			//////////////////////////

			if (operation.op === 'add') {
				translationData.item = operation.value;
			}
			else if (operation.op === 'replace') {
				translationData.after = operation.value;
				translationData.before = before;
				for (var j = 0; j < splPath.length; j += 1)
					translationData.before = translationData.before[splPath[j]];
			}
			else if (operation.op === 'remove') {
				translationData.item = before;
				for (var j = 0; j < splPath.length; j += 1)
					translationData.item = translationData.item[splPath[j]];
			}
			else if (operation.op === 'move') {
				translationData.item = before;

				var splpath2 = operation.from.split('/').slice(1);
				for (var j = 0; j < splpath2.length; j += 1)
					translationData.item = translationData.item[splpath2[j]];
			}

			//////////////////////////
			// When the modification is adding or removing ids that refer to something else, we
			// replace the id by the actual value it refers to, to allow proper printing
			// i.e. Avoid "Added 347b57e7-a8e0-441c-a673-419b2aefb6f8 to sites in form x"
			//////////////////////////

			if (operation.op === 'add' || operation.op === 'remove') {
				if (editedField === 'users_dataSources')
					translationData.item = before.forms.find(e => e.id === translationData.item);

				if (editedField === 'groups_members' || editedField === 'forms_entities' || editedField === 'users_entities')
					translationData.item = before.entities.find(e => e.id === translationData.item);

				if (editedField === 'forms_elements_partitions_groups_members')
					translationData.item = translationData.partition.elements.find(e => e.id == translationData.item);
			}

			return translationData;
		}

	}
});



export default module;