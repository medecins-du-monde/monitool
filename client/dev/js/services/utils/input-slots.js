"use strict";

angular
	.module('monitool.services.utils.input-slots', [])


	.factory('TimeSlot', function() {

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
			// No conversion needed
			if (this.periodicity === newPeriodicity)
				return this;

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

		return TimeSlot;
	})

	.factory('InputSlots', function(TimeSlot) {
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

		InputSlots.getList = function(project, entity, form) {
			var start = InputSlots.maxDate([project.start, entity ? entity.start : null, form.start]),
				end   = InputSlots.minDate([project.end, entity ? entity.end : null, form.end]),
				list  = InputSlots.iterate(start, end, form.periodicity);

			return list;
		};

		return InputSlots;
	})

	.filter('formatSlot', function(TimeSlot, $rootScope, $locale, $filter) {

		return function(slotValue) {
			if (slotValue === '_total' || slotValue == 'total')
				return 'Total';

			else {
				var slot = new TimeSlot(slotValue);

				if (slot.periodicity === 'year')
					return slot.value;

				else if (slot.periodicity === 'quarter') {
					if ($rootScope.language == 'fr') {
						var trim = {"1": "1er", "2": "2ème", "3": "3ème", "4": "4ème"}
						return trim[slot.value.substring(6)] + ' trim. ' + slot.value.substring(0, 4);
					}
					else if ($rootScope.language == 'es') {
						var trim = {"1": "Primer", "2": "Segundo", "3": "Tercero", "4": "Quarto"}
						return trim[slot.value.substring(6)] + ' trim. ' + slot.value.substring(0, 4);
					}
					else
						return slot.value;
				}

				else if (slot.periodicity === 'month') {
					return $locale.DATETIME_FORMATS.STANDALONEMONTH[slot.value.substring(5, 7) - 1] + ' ' + slot.value.substring(0, 4);
				}

				else if (slot.periodicity === 'week_sat' || slot.periodicity === 'week_sun' || slot.periodicity === 'week_mon') {
					if ($rootScope.language == 'fr' || $rootScope.language == 'es')
						return 'Sem. ' + slot.value.substring(6, 8) + ' ' + slot.value.substring(0, 4);
					else
						return slot.value.substring(0, 4) + '-W' + slot.value.substring(6, 8);
				}

				else if (slot.periodicity === 'day') {
					return $filter('date')(slot.getFirstDate(), 'mediumDate', 'utc');
				}

				else
					throw new Error();
			}
		};
	})

	.filter('formatSlotRange', function(TimeSlot, $filter) {
		return function(slotValue) {
			var slot = new TimeSlot(slotValue);
			return $filter('date')(slot.getFirstDate(), 'fullDate', 'utc') + ' - ' + $filter('date')(slot.getLastDate(), 'fullDate', 'utc');
		};
	})

	.filter('formatSlotLong', function($filter) {
		return function(slotValue) {
			if (slotValue === '_total' || slotValue === 'total')
				return 'Total';
			else
				return $filter('formatSlot')(slotValue) + ' (' + $filter('formatSlotRange')(slotValue) + ')';
		}
	})

