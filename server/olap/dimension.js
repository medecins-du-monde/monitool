"use strict";

var TimeSlot = require('./time-slot');

function minDate(dates) {
	return dates.reduce(function(d, memo) { return !memo || memo > d ? d : memo; });
};

function maxDate(dates) {
	return dates.reduce(function(d, memo) { return !memo || memo < d ? d : memo; });
};

function iterate(begin, end, periodicity) {
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


class Dimension {

	static createTime(project, form, element, inputs) {
		var periods;

		if (form.periodicity === 'free') {
			periods = {};
			inputs.forEach(function(input) { periods[input.period] = true; });
			periods = Object.keys(periods);
			periods.sort();

			return new Dimension(form.periodicity === 'free' ? 'day' : form.periodicity, periods, element.timeAgg);
		}
		else {
			var start   = maxDate([project.start, form.start]),
				end     = minDate([project.end, form.end]);

			periods = iterate(new Date(start + 'T00:00:00Z'), new Date(end + 'T00:00:00Z'), form.periodicity);

			return new Dimension(form.periodicity, periods, element.timeAgg);
		}
	}

	static createLocation(project, form, element) {
		var entities;
		if (form.collect == 'some_entity')
			entities = form.entities;
		else if (form.collect == 'entity')
			entities = project.entities.map(function(e) { return e.id; });

		if (!entities)
			throw new Error('No location dimension');
		else
			return new Dimension('entity', entities, element.geoAgg);
	}

	static createPartition(partition) {
		return new Dimension(
			partition.id,
			partition.elements.map(function(e) { return e.id; }),
			partition.aggregation
		);
	};

	/**
	 * id = "month"
	 * items = ["2010-01", "2010-02", ...]
	 * aggregation = "sum"
	 */
	constructor(id, items, aggregation) {
		this.id = id;
		this.items = items;
		this.aggregation = aggregation;
	}
}


module.exports = Dimension;
