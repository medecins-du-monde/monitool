"use strict";


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






var removeDeadReferenceFromIndicator = function(project, indicator) {
	if (indicator.computation === null)
		return;

	for (var key in indicator.computation.parameters) {
		var parameter = indicator.computation.parameters[key];
		var element = null;

		project.forms.forEach(function(f) {
			f.elements.forEach(function(e) {
				if (e.id === parameter.elementId)
					element = e;
			});
		});

		// Element was not found.
		if (!element) {
			indicator.computation = null;
			console.log("Deleted computation on ", project.country, indicator.display, 'because of missing variable');
			return;
		}

		for (var partitionId in parameter.filter) {
			var partition = element.partitions.find(function(p) { return p.id === partitionId; });
			if (!partition) {
				indicator.computation = null;
				console.log("Deleted computation on ", project.country, indicator.display, 'because of missing partition');
				return;
			}

			var elementIds = parameter.filter[partitionId];
			for (var i = 0; i < elementIds.length; ++i) {
				if (!partition.elements.find(function(e) { return e.id === elementIds[i]; })) {
					indicator.computation = null;
					console.log("Deleted computation on ", project.country, indicator.display, 'because of missing partition element');
					return;
				}
			}
		}
	}

	console.log('Not Deleted formula on', project.country, indicator.display)
};

function rewriteIndicator(indicator) {
	delete indicator.targetType;
	delete indicator.unit;
	delete indicator.indicatorId;

	// Guess computation from formula
	indicator.computation = {};
	
	var cleanFormula = indicator.formula.replace(/ +/g, ''),
		withoutNames = cleanFormula.replace(/([_a-z]+[0-9]*)+/gi, '_');

	// detected copied value
	if (withoutNames === '_') {
		// it's a copy
		indicator.computation.formula = 'copied_value';
		indicator.computation.parameters = {};
		for (var key in indicator.parameters) {
			indicator.computation.parameters.copied_value = indicator.parameters[key]
			break;
		}
	}
	// detected percentage
	else if (withoutNames === '100*_/_' || withoutNames === '_/_*100' || withoutNames === '_*100/_') {
		// it's a percentage
		var match = cleanFormula.match(/([_a-z]+[0-9]*)+/gi);
		
		if (match.length === 2) {
			indicator.computation.formula = '100 * numerator / denominator';
			indicator.computation.parameters = {
				numerator: indicator.parameters[match[0]],
				denominator: indicator.parameters[match[1]]
			};
		}
		else {
			indicator.computation.formula = indicator.formula;
			indicator.computation.parameters = indicator.parameters;
		}
	}
	// don't know (or fixed value)
	else {
		indicator.computation.formula = indicator.formula;
		indicator.computation.parameters = indicator.parameters;
	}

	// Remove old formula.
	delete indicator.formula;
	delete indicator.parameters;
}

var nano = require('nano');
var old = nano('http://localhost:5984').use('monitool');

old.list({include_docs: true}, function(error, result) {
	var documents = {indicator: {}, project: {}, theme: {}, type: {}, input: {}, user: {}, report: {}};
	result.rows.forEach(function(item) {
		if (item.id.substring(0, '_design'.length) !== '_design')
			documents[item.doc.type][item.doc._id] = item.doc;
	});

	var docsToUpdate = [];

	var id;

	for (id in documents.user) {
		var user = documents.user[id];
		
		// roles are not a single field
		if (user.roles.indexOf('_admin') !== -1)
			user.role = 'admin';
		else if (user.roles.indexOf('project') !== -1)
			user.role = 'project';
		else
			user.role = 'common';

		delete user.roles;

		docsToUpdate.push(user);
	}

	for (id in documents.indicator) {
		var indicator = documents.indicator[id];

		// description is old comments.
		indicator.description = indicator.comments;

		// delete all the rest.
		delete indicator.standard;
		delete indicator.sources;
		delete indicator.comments;
		delete indicator.operation;
		delete indicator.types;

		docsToUpdate.push(indicator);
	}

	for (id in documents.project) {
		var project = documents.project[id];

		// Remove activities, fix indicators
		project.logicalFrames.forEach(function(logicalFrame) {
			logicalFrame.indicators.forEach(rewriteIndicator);
			logicalFrame.indicators.forEach(removeDeadReferenceFromIndicator.bind(null, project));

			logicalFrame.purposes.forEach(function(purpose) {
				purpose.indicators.forEach(rewriteIndicator);
				purpose.indicators.forEach(removeDeadReferenceFromIndicator.bind(null, project));

				purpose.outputs.forEach(function(output) {
					output.indicators.forEach(rewriteIndicator);
					output.indicators.forEach(removeDeadReferenceFromIndicator.bind(null, project));

					delete output.activities;
				});
			});
		});

		project.entities.forEach(function(entity) {
			// set default dates.
			if (entity.start == project.start)
				entity.start = null;

			if (entity.end == project.end)
				entity.end = null;
		});

		// Add order and distribution to form elements
		project.forms.forEach(function(form) {
			// set default dates.
			if (form.start == project.start)
				form.start = null;

			if (form.end == project.end)
				form.end = null;

			if (form.periodicity === 'week')
				form.periodicity = 'week_mon';

			form.elements.forEach(function(element) {
				element.distribution = Math.ceil(element.partitions.length / 2);
				element.order = 0;
			});
		});

		project.crossCutting = {};
		project.extraIndicators = [];

		docsToUpdate.push(project);

	}

	for (var id in documents.type) {
		var type = documents.type[id];

		// Delete all types.
		docsToUpdate.push({_id: type._id, _rev: type._rev, _deleted: true});
	}

	for (var id in documents.input) {
		var input = documents.input[id];


		var project = documents.project[input.project];
		if (!project) {
			// project does not exists => delete input.
			console.log('projectless input', input._id);
			docsToUpdate.push({_id: input._id, _rev: input._rev, _deleted: true});
			continue;
		}

		var form = project.forms.find(function(form) { return form.id === input.form; });
		if (!form) {
			// project does not exists => delete input.
			console.log('formless input', input._id);
			docsToUpdate.push({_id: input._id, _rev: input._rev, _deleted: true});
			continue;
		}

		// three reasons exists for update: wrong period, additional of invalid values, and missing elements.
		var needUpdate = false;
		if (form.periodicity !== 'free' && form.periodicity !== 'day') {
			// period is no longer valid, this will break the ID => delete the input.
			docsToUpdate.push({_id: input._id, _rev: input._rev, _deleted: true});

			var prev = input.period;

			// recreate new input.
			delete input._rev
			input.period = TimeSlot.fromDate(new Date(input.period + 'T00:00:00Z'), form.periodicity).value;
			input._id = [input.project, input.entity, input.form, input.period].join(':');
			needUpdate = true;

			console.log('rewrote period', prev, '=>', input.period);
		}
		
		form.elements.forEach(function(variable) {
			if (!input.values[variable.id]) {
				input.values[variable.id] = [0]; // next loop will fix the size if wrong
				needUpdate = true;

				console.log('missing variable in input', input._id);
			}
		});

		for (var variableId in input.values) {
			var element = form.elements.find(function(e) { return e.id === variableId; });
			if (!element) {
				delete input.values[variableId];
				needUpdate = true;

				console.log('additional variable in input', input._id);
			}

			var expectedSize = 1;
			element.partitions.forEach(function(p) { expectedSize *= p.elements.length; });
			if (input.values[variableId].length !== expectedSize) {
				console.log('wrong variable size in input', input._id, input.values[variableId].length, expectedSize);

				input.values[variableId] = new Array(expectedSize);
				for (var i = 0; i < expectedSize; ++i)
					input.values[variableId][i] = 0;
				needUpdate = true;
			}
		}

		if (needUpdate)
			docsToUpdate.push(input);
	}

	// console.log(JSON.stringify(docsToUpdate).length);

	old.bulk({docs: docsToUpdate}, function(error, done) {
		console.log(error);
	});

});


