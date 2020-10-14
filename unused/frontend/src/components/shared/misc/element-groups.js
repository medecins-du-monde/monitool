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

const module = angular.module(
	'monitool.components.misc.collection-sites',
	[]
);


module.component('elementGroups', {
	bindings: {
		ids: '<',
		items: '<',
		groups: '<'
	},

	template: require('./element-groups.html'),

	controller: class ElementGroupsController {

		$onChanges(changes) {
			this.view = this._model2view(this.ids, this.items, this.groups);
		}

		_model2view(model, elements, groups) {
			groups = groups || [];

			if (model.length == elements.length)
				return [{name: 'project.all_elements'}];

			// retrieve all groups that are in the list.
			const selectedGroups = groups.filter(group => {
				return group.members.every(id => model.includes(id));
			});

			const additionalIds = model.filter(id => {
				return selectedGroups.every(group => !group.members.includes(id));
			});

			return [
				...selectedGroups,
				...additionalIds.map(id => elements.find(e => e.id == id))
			];
		}
	}
});


export default module.name;