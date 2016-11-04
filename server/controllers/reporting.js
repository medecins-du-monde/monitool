"use strict";

var async = require('async'),
	express = require('express'),
	moment  = require('moment'),
	database = require('../models/database'),
	Input   = require('../models/resources/input'),
	Project = require('../models/resources/project');


function _arrayBufferToBase64(ab) {
    // var buf = new Buffer(ab.byteLength);
    // var view = new Uint8Array(ab);
    // for (var i = 0; i < buf.length; ++i) {
    //     buf[i] = view[i];
    // }
    // return buf.toString('base64');

    var view = new Int32Array(ab);
 	return Array.prototype.slice.call(view);
}

		var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};

		var InputSlots = {};

		InputSlots.minDate = function(dates) {
			return dates.reduce(function(d, memo) { return !memo || memo > d ? d : memo; });
		};

		InputSlots.maxDate = function(dates) {
			return dates.reduce(function(d, memo) { return !memo || memo < d ? d : memo; });
		};

		InputSlots.iterate = function(begin, end, periodicity) {
			var current = moment.utc(begin).startOf(periodicity == 'week' ? 'isoWeek' : periodicity),
				end = moment.utc(end).endOf(periodicity == 'week' ? 'isoWeek' : periodicity);

			if (end.isAfter()) // do not allow to go in the future
				end = moment.utc();

			var periods = [];
			while (current.isBefore(end)) {
				periods.push(current.format(formats[periodicity]));
				current.add(1, periodicity);
			}

			return periods;
		};

		InputSlots.getList = function(project, entity, form) {
			var start = InputSlots.maxDate([project.start, entity ? entity.start : null, form.start]),
				end   = InputSlots.minDate([project.end, entity ? entity.end : null, form.end]),
				list  = InputSlots.iterate(start, end, form.periodicity);

			return list;
		};

		InputSlots.isValid = function(project, entity, form, slot) {
			if (form.periodicity === 'free')
				return !!slot.match(/^\d\d\d\d\-\d\d\-\d\d$/);
			else
				return InputSlots.getList(project, entity, form).indexOf(slot) !== -1;
		};


		/**
		 * id = "month"
		 * items = ["2010-01", "2010-02", ...]
		 * aggregation = "sum"
		 */
		var Dimension = function(id, items, aggregation) {
			this.id = id;
			this.items = items;
			this.aggregation = aggregation;
		};

		Dimension.createTime = function(project, form, element, inputs) {
			var periods;

			if (form.periodicity === 'free') {
				periods = {};
				inputs.forEach(function(input) { periods[input.period] = true; });
				periods = Object.keys(periods);
				periods.sort();

				return new Dimension('day', periods, element.timeAgg);
			}
			else {
				periods = InputSlots.getList(project, null, form);
				return new Dimension(form.periodicity, periods, element.timeAgg);
			}
		};

		Dimension.createLocation = function(project, form, element) {
			var entities;
			if (form.collect == 'some_entity')
				entities = form.entities;
			else if (form.collect == 'entity')
				entities = project.entities.map(function(e) { return e.id; });

			if (!entities)
				throw new Error('No location dimension');
			else
				return new Dimension('entity', entities, element.geoAgg);
		};

		Dimension.createPartition = function(partition) {
			return new Dimension(
				partition.id,
				partition.elements.map(function(e) { return e.id; }),
				partition.aggregation
			);
		};


		var DimensionGroup = function(id, childDimension, mapping) {
			this.id = id;
			this.childDimension = childDimension;
			// this.items = Object.keys(mapping);
			this.mapping = mapping;
		};

		DimensionGroup.createTime = function(parent, dimension) {
			// Constants. Should go in a configuration file somewhere.
			var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};
			var timeDimensions = Object.keys(formats);

			// Check arguments
			if (timeDimensions.indexOf(parent) === -1)
				throw new Error(parent + ' is not a valid time dimension.');

			if (timeDimensions.indexOf(dimension.id) === -1)
				throw new Error(dimension.id + ' is not a valid time dimension');

			if (timeDimensions.indexOf(parent) >= timeDimensions.indexOf(dimension.id))
				throw new Error('Cannot compute ' + parent + ' from ' + dimension.id);

			// Create DimensionGroup mapping from Dimension items.
			var childFormat = formats[dimension.id], parentFormat = formats[parent];
			var mapping = {};

			dimension.items.forEach(function(childValue) {
				var parentValue = moment.utc(childValue, childFormat).format(parentFormat);

				mapping[parentValue] = mapping[parentValue] || [];
				mapping[parentValue].push(childValue);
			});

			return new DimensionGroup(parent, dimension.id, mapping);
		};

		DimensionGroup.createLocation = function(project, form) {
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
		};

		DimensionGroup.createPartition = function(partition) {
			var pgroups = {};
			partition.groups.forEach(function(g) { pgroups[g.id] = g.members; });
			return new DimensionGroup(partition.id + '_g', partition.id, pgroups);
		};


		/**
		 * id = "a2b442c9-1dde-42dd-9a04-773818d75e71" (variableId from form)
		 * dimensions = [Dimension(...), Dimension(...), Dimension(...), ...]
		 * data = [0, 1, 2, 3, ...]
		 */
		var Cube = function(id, dimensions, dimensionGroups, data) {
			// Check size.
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });
			if (data.length !== dataSize)
				throw new Error('Invalid data size');


			this.id = id;
			this.dimensions = dimensions;
			this.dimensionGroups = dimensionGroups;
			this.data = _arrayBufferToBase64(data.buffer);

			// // Index dimensions and dimensionGroups by id
			// this.dimensionsById = {};
			// this.dimensionGroupsById = {};
			// this.dimensions.forEach(function(d) { this.dimensionsById[d.id] = d; }.bind(this));
			// this.dimensionGroups.forEach(function(d) { this.dimensionGroupsById[d.id] = d; }.bind(this));
		};

		Cube.fromElement = function(project, form, element, inputs) {
			////////////
			// Build dimensions & groups
			////////////
			var dimensions = [], dimensionGroups = [];

			// Time
			dimensions.push(Dimension.createTime(project, form, element, inputs));
			['week', 'month', 'quarter', 'year'].forEach(function(periodicity) {
				// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
				try { dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0])); }
				catch (e) {}
			});
			
			// Location
			if (form.collect == 'entity' || form.collect == 'some_entity') {
				dimensions.push(Dimension.createLocation(project, form, element));
				if (project.groups.length)
					dimensionGroups.push(DimensionGroup.createLocation(project, form))
			}

			// Partitions
			element.partitions.forEach(function(partition) {
				dimensions.push(Dimension.createPartition(partition));
				if (partition.groups.length)
					dimensionGroups.push(DimensionGroup.createPartition(partition));
			});

			////////////
			// Build data
			////////////
			var dataSize = 1;
			dimensions.forEach(function(dimension) { dataSize *= dimension.items.length; });

			var data = new Int32Array(dataSize)
			for (var i = 0; i < dataSize; ++i)
				data[i] = -2147483648;

			inputs.forEach(function(input) {
				// Compute location where this subtable should go, and length of data to copy.
				var offset = dimensions[0].items.indexOf(input.period),
					length = 1; // Slow!

				if (offset < 0)
					console.log(offset)

				if (form.collect == 'entity' || form.collect == 'some_entity') {
					if (dimensions[1].items.indexOf(input.entity) < 0)
						console.log('WTF')

					offset = offset * dimensions[1].items.length + dimensions[1].items.indexOf(input.entity);
				}

				element.partitions.forEach(function(partition) {
					offset *= partition.elements.length;
					length *= partition.elements.length;
				});

				// Retrieve data from input, and copy (if valid).
				var source = input.values[element.id];
				if (source && source.length === length) {
					// Copy into destination table.
					for (var i = 0; i < length; ++i)
						data[offset + i] = source[i];
				}
				else {
					console.log("Skip variable", element.id, 'from', input._id);
				}
			});

			// Build and fill cube
			return new Cube(element.id, dimensions, dimensionGroups, data);
		};

		Cube.fromProject = function(project, allInputs) {
			var cubes = [];

			console.log(JSON.stringify(project, null, "\t"))
			project.forms.forEach(function(form) {
				var inputs = allInputs.filter(function(input) { return input.form === form.id; })

				form.elements.forEach(function(element) {
					cubes.push(Cube.fromElement(project, form, element, inputs));
				});
			});

			return cubes;
		};




module.exports = express.Router()

	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id != request.user.projectId)
			return response.status(404).json({error: true, message: "Not Found"});

		Project.get(request.params.id, function(error, project) {
			Input.list({mode: "project_inputs", projectId: request.params.id}, function(error, inputs) {
				response.json(Cube.fromProject(project, inputs));
			});
		});
	})

	.get('/indicator/:id', function(request, response) {
		if (request.user.type == 'partner')
			return response.status(403).json({error: true, message: "Forbidden"});

		Project.list({mode: "crossCutting", indicatorId: request.params.id}, function(error, projects) {
			var inputsQueries = projects.map(function(p) { return {mode: 'project_inputs', projectId: p._id}; });

			async.map(inputsQueries, Input.list, function(error, inputsByProject) {
				var result = {};
				for (var i = 0; i < projects.length; ++i) {
					var project = projects[i], inputs = inputsByProject[i];
					result[project._id] = Cube.fromProject(project, inputs);
				}

				response.json(result);
			});
		});
	});

