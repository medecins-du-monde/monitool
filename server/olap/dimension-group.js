"use strict";

var TimeSlot = require('./time-slot');

class DimensionGroup {

	static createTime(parent, dimension) {
		// Create DimensionGroup mapping from Dimension items.
		var mapping = {};

		dimension.items.forEach(function(childValue) {
			var parentValue = new TimeSlot(childValue).toUpperSlot(parent).value;

			mapping[parentValue] = mapping[parentValue] || [];
			mapping[parentValue].push(childValue);
		});

		return new DimensionGroup(parent, dimension.id, mapping);
	}

	static createLocation(project, form) {
		var entities;
		if (form.collect == 'some_entity')
			entities = form.entities;
		else if (form.collect == 'entity')
			entities = project.entities.map(function(e) { return e.id; });

		var groups = {};
		project.groups.forEach(function(group) {
			groups[group.id] = group.members.filter(function(id) {
				return entities.indexOf(id) !== -1;
			});

			if (groups[group.id].length === 0)
				delete groups[group.id];
		});

		return new DimensionGroup('group', 'entity', groups);
	}

	static createPartition(partition) {
		var pgroups = {};
		partition.groups.forEach(function(g) { pgroups[g.id] = g.members; });
		return new DimensionGroup(partition.id + '_g', partition.id, pgroups);
	}

	constructor(id, childDimension, mapping) {
		this.id = id;
		this.childDimension = childDimension;
		this.items = Object.keys(mapping);
		this.mapping = mapping;
	}
}

module.exports = DimensionGroup;

