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

import TimeSlot from './time-slot';

/**
 * A DimensionGroup allows to query cubes on dimension aggregates.
 * For instance, for a cube containing a "date" dimension, then a "month" dimension group can be created.
 */
export default class DimensionGroup {

	static createTime(parent, dimension) {
		// Create DimensionGroup mapping from Dimension items.
		var mapping = {};

		dimension.items.forEach(childValue => {
			var parentValue = new TimeSlot(childValue).toUpperSlot(parent).value;

			mapping[parentValue] = mapping[parentValue] || [];
			mapping[parentValue].push(childValue);
		});

		return new DimensionGroup(parent, dimension.id, mapping);
	}

	static createLocation(project, form) {
		var groups = {};

		project.groups.forEach(group => {
			groups[group.id] = group.members.filter(id => form.entities.includes(id));

			if (groups[group.id].length === 0)
				delete groups[group.id];
		});

		return new DimensionGroup('group', 'entity', groups);
	}

	static createPartition(partition) {
		var pgroups = {};
		partition.groups.forEach(g => pgroups[g.id] = g.members);
		return new DimensionGroup(partition.id + '_g', partition.id, pgroups);
	}

	constructor(id, childDimension, mapping) {
		this.id = id;
		this.childDimension = childDimension;
		this.items = Object.keys(mapping);
		this.mapping = mapping;
	}
}
