"use strict";

var async = require('async'),
	express = require('express'),
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


var TimeSlot = function(value) {
	this.value = value;
	this.periodicity = TimeSlot._detectPeriodicity(value);
};

TimeSlot.fromDate = function(utcDate, periodicity) {
	if (periodicity === 'day')
		return new TimeSlot(utcDate.toISOString().substring(0, 10));

	else if (periodicity === 'week_sat' || periodicity === 'week_sun' || periodicity === 'week_mon') {
		// Good epoch to count week is the first inferior to searched date (among next, current and last year, in that order).
		var year = utcDate.getUTCFullYear() + 1,
			epoch = TimeSlot._getEpidemiologicWeekEpoch(year, periodicity);

		while (utcDate.getTime() < epoch.getTime())
			epoch = TimeSlot._getEpidemiologicWeekEpoch(--year, periodicity);
		
		var weekNumber = Math.floor((utcDate.getTime() - epoch.getTime()) / 1000 / 60 / 60 / 24 / 7) + 1;
		if (weekNumber < 10)
			weekNumber = '0' + weekNumber;

		return new TimeSlot(year + '-W' + weekNumber + '-' + periodicity.substr(-3));
	}

	else if (periodicity === 'month')
		return new TimeSlot(utcDate.toISOString().substring(0, 7));

	else if (periodicity === 'quarter')
		return new TimeSlot(
			utcDate.getUTCFullYear().toString() +
			'-Q' + (1 + Math.floor(utcDate.getUTCMonth() / 3)).toString()
		);

	else if (periodicity === 'year')
		return new TimeSlot(utcDate.getUTCFullYear().toString());

	else
		throw new Error("Invalid periodicity");
};


TimeSlot._upperSlots = {
	'day': ['week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'year'],
	'week_sat': ['month', 'quarter', 'year'],
	'week_sun': ['month', 'quarter', 'year'],
	'week_mon': ['month', 'quarter', 'year'],
	'month': ['quarter', 'year'],
	'quarter': ['year'],
	'year': []
};

// This function is incredibly verbose for what it does
// Probably a single divmod could give the same result but debugging was nightmarish.
TimeSlot._getEpidemiologicWeekEpoch = function(year, periodicity) {
	var SUNDAY = 0, MONDAY = 1, TUESDAY = 2, WEDNESDAY = 3, THURSDAY = 4, FRIDAY = 5, SATURDAY = 6;
	var firstDay = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)).getUTCDay();
	var epoch = null;

	if (periodicity === 'week_sun') {
		if (firstDay === SUNDAY)
			// Lucky us, first day of year is Sunday
			epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
		else if (firstDay === MONDAY)
			// Epidemiologic week started last day of december
			epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
		else if (firstDay === TUESDAY)
			// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
			epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
		else if (firstDay === WEDNESDAY)
			// 3 days in december, 4 in january
			epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
		else if (firstDay === THURSDAY)
			// we can't have 4 days in december, so the epoch is the 4th of january (the first sunday of the year)
			epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
		else if (firstDay === FRIDAY)
			// same as before: first sunday of the year
			epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
		else if (firstDay === SATURDAY)
			// same as before: first sunday of the year
			epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
	}
	else if (periodicity === 'week_sat') {
		if (firstDay === SATURDAY)
			// Lucky us, first day of year is Saturday
			epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
		else if (firstDay === SUNDAY)
			// Epidemiologic week started last day of december
			epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
		else if (firstDay === MONDAY)
			// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
			epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
		else if (firstDay === TUESDAY)
			// 3 days in december, 4 in january
			epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
		else if (firstDay === WEDNESDAY)
			// we can't have 4 days in december, so the epoch is the 4th of january (the first saturday of the year)
			epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
		else if (firstDay === THURSDAY)
			// same as before: first saturday of the year
			epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
		else if (firstDay === FRIDAY)
			// same as before: first saturday of the year
			epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
	}
	else if (periodicity === 'week_mon') {
		if (firstDay === MONDAY)
			// Lucky us, first day of year is Sunday
			epoch = Date.UTC(year, 0, 1, 0, 0, 0, 0);
		else if (firstDay === TUESDAY)
			// Epidemiologic week started last day of december
			epoch = Date.UTC(year - 1, 11, 31, 0, 0, 0, 0);
		else if (firstDay === WEDNESDAY)
			// Epidemiologic week started the previous day (still 2 day in december and 5 in january)
			epoch = Date.UTC(year - 1, 11, 30, 0, 0, 0, 0);
		else if (firstDay === THURSDAY)
			// 3 days in december, 4 in january
			epoch = Date.UTC(year - 1, 11, 29, 0, 0, 0, 0);
		else if (firstDay === FRIDAY)
			// we can't have 4 days in december, so the epoch is the 4th of january (the first monday of the year)
			epoch = Date.UTC(year, 0, 4, 0, 0, 0, 0);
		else if (firstDay === SATURDAY)
			// same as before: first monday of the year
			epoch = Date.UTC(year, 0, 3, 0, 0, 0, 0);
		else if (firstDay === SUNDAY)
			// same as before: first monday of the year
			epoch = Date.UTC(year, 0, 2, 0, 0, 0, 0);
	}
	else
		throw new Error("Invalid day");

	return new Date(epoch);
};


TimeSlot._detectPeriodicity = function(slotValue) {
	if (slotValue.match(/^\d{4}$/))
		return 'year'
	
	if (slotValue.match(/^\d{4}\-Q\d$/))
		return 'quarter'
	
	if (slotValue.match(/^\d{4}\-\d{2}$/))
		return 'month'
	
	if (slotValue.match(/^\d{4}\-W\d{2}-sat$/))
		return 'week_sat'
	
	if (slotValue.match(/^\d{4}\-W\d{2}-sun$/))
		return 'week_sun'
	
	if (slotValue.match(/^\d{4}\-W\d{2}-mon$/))
		return 'week_mon'
	
	if (slotValue.match(/^\d{4}\-\d{2}\-\d{2}$/))
		return 'day'

	return null;
};

TimeSlot.prototype.getFirstDate = function() {
	if (this.periodicity === 'day')
		return new Date(this.value + 'T00:00:00Z');

	else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon')
		return new Date(
			TimeSlot._getEpidemiologicWeekEpoch(this.value.substring(0, 4), this.periodicity).getTime() + 
			(this.value.substring(6, 8) - 1) * 7 * 24 * 60 * 60 * 1000 // week numbering starts with 1
		);

	else if (this.periodicity === 'month')
		return new Date(this.value + '-01T00:00:00Z');

	else if (this.periodicity === 'quarter') {
		var month = (this.value.substring(6, 7) - 1) * 3 + 1;
		if (month < 10)
			month = '0' + month;

		return new Date(this.value.substring(0, 5) + month + '-01T00:00:00Z');
	}
	else if (this.periodicity === 'year')
		return new Date(this.value + '-01-01T00:00:00Z');
};

TimeSlot.prototype.getLastDate = function() {
	if (this.periodicity === 'day')
		// last day is current day
		return this.getFirstDate();

	else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') {
		// last day is last day of the week according to epoch
		return new Date(this.getFirstDate().getTime() + 6 * 24 * 60 * 60 * 1000);
	}

	else if (this.periodicity === 'month') {
		var monthDate = this.getFirstDate();
		monthDate.setUTCMonth(monthDate.getUTCMonth() + 1); // add one month.
		monthDate.setUTCDate(0); // go to last day of previous month.
		return monthDate;
	}

	else if (this.periodicity === 'quarter') {
		var quarterDate = this.getFirstDate();
		quarterDate.setUTCMonth(quarterDate.getUTCMonth() + 3); // add three month.
		quarterDate.setUTCDate(0); // go to last day of previous month.
		return quarterDate;
	}

	else if (this.periodicity === 'year')
		return new Date(this.value + '-12-31T00:00:00Z');
};

TimeSlot.prototype.toUpperSlot = function(newPeriodicity) {
	// Raise when we make invalid conversions
	if (TimeSlot._upperSlots[this.periodicity].indexOf(newPeriodicity) === -1)
		throw new Error('Cannot convert ' + this.periodicity + ' to ' + newPeriodicity);

	// For days, months and quarters, we can assume that getting the slot from any date works
	// as long as we don't cheat the method in getting a lower slot.
	if (this.periodicity === 'day' || this.periodicity === 'month' || this.periodicity === 'quarter')
		return TimeSlot.fromDate(this.getFirstDate(), newPeriodicity);
	
	// if it's a week, we need to be a bit more cautious.
	// the month/quarter/year is not that of the first or last day, but that of the middle day of the week
	// (which depend on the kind of week, but adding 3 days to the beginning gives the good date).
	else if (this.periodicity === 'week_sat' || this.periodicity === 'week_sun' || this.periodicity === 'week_mon') {
		var date = new Date(this.getFirstDate().getTime() + 3 * 24 * 60 * 60 * 1000);
		return TimeSlot.fromDate(date, newPeriodicity);
	}
};

TimeSlot.prototype.next = function() {
	var date = this.getLastDate();
	date.setUTCDate(date.getUTCDate() + 1);
	return TimeSlot.fromDate(date, this.periodicity);
};


var InputSlots = {};

InputSlots.minDate = function(dates) {
	return dates.reduce(function(d, memo) { return !memo || memo > d ? d : memo; });
};

InputSlots.maxDate = function(dates) {
	return dates.reduce(function(d, memo) { return !memo || memo < d ? d : memo; });
};

InputSlots.iterate = function(begin, end, periodicity) {
	var slot = TimeSlot.fromDate(begin, periodicity),
		endSlot = TimeSlot.fromDate(end, periodicity);

	var now = TimeSlot.fromDate(new Date(), periodicity);
	if (now.value < endSlot.value)
		endSlot = now;

	var slots = [];
	while (slot.value < endSlot.value) {
		slots.push(slot.value);
		slot = slot.next();
	}
	slots.push(slot.value);

	return slots;
};

// InputSlots.getList = function(project, entity, form) {
// 	var start = InputSlots.maxDate([project.start, entity ? entity.start : null, form.start]),
// 		end   = InputSlots.minDate([project.end, entity ? entity.end : null, form.end]),
// 		list  = InputSlots.iterate(start, end, form.periodicity);

// 	return list;
// };


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
				var start   = InputSlots.maxDate([project.start, form.start]),
					end     = InputSlots.minDate([project.end, form.end]);

				periods = InputSlots.iterate(
					new Date(start + 'T00:00:00Z'),
					new Date(end + 'T00:00:00Z'),
					form.periodicity
				);

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
			// var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};
			// var timeDimensions = Object.keys(formats);

			// Check arguments
			// if (timeDimensions.indexOf(parent) === -1)
			// 	throw new Error(parent + ' is not a valid time dimension.');

			// if (timeDimensions.indexOf(dimension.id) === -1)
			// 	throw new Error(dimension.id + ' is not a valid time dimension');

			// if (timeDimensions.indexOf(parent) >= timeDimensions.indexOf(dimension.id))
			// 	throw new Error('Cannot compute ' + parent + ' from ' + dimension.id);

			// Create DimensionGroup mapping from Dimension items.
			// var childFormat = formats[dimension.id], parentFormat = formats[parent];
			var mapping = {};

			dimension.items.forEach(function(childValue) {
				var parentValue = new TimeSlot(childValue).toUpperSlot(parent).value;

				// var parentValue = moment.utc(childValue, childFormat).format(parentFormat);

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
			// this.data = _arrayBufferToBase64(data.buffer);
			this.data = data;

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
			['week_sat', 'week_sun', 'week_mon', 'month', 'quarter', 'year'].forEach(function(periodicity) {
				// This will fail while indexOf(periodicity) < indexOf(form.periodicity)
				try {
					dimensionGroups.push(DimensionGroup.createTime(periodicity, dimensions[0]));
				}
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

			var data = new Array(dataSize)
			for (var i = 0; i < dataSize; ++i)
				data[i] = -2147483648;

			inputs.forEach(function(input) {
				// Compute location where this subtable should go, and length of data to copy.
				var offset = dimensions[0].items.indexOf(input.period),
					length = 1; // Slow!

				if (offset < 0) {
					console.log("Skip variable", element.id, 'from', input._id, "(did not find period in timeDim)");
					return;
				}

				if (form.collect == 'entity' || form.collect == 'some_entity') {
					if (dimensions[1].items.indexOf(input.entity) < 0) {
						console.log("Skip variable", element.id, 'from', input._id, "(did not find entity in spacialDim)");
						return;
					}

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
					console.log("Skip variable", element.id, 'from', input._id, "(value size mismatch)");
				}
			});

			// Build and fill cube
			return new Cube(element.id, dimensions, dimensionGroups, data);
		};

		Cube.fromProject = function(project, allInputs) {
			var cubes = [];

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
				response.json({type: 'cubes', projectId: project._id, cubes: Cube.fromProject(project, inputs)});
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

				response.json({type: 'cubes', cubes: result});
			});
		});
	});

