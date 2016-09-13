"use strict";

angular
	.module('monitool.services.utils.input-slots', [])

	.factory('InputSlots', function($rootScope, $locale, $filter) {
		var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};

		var InputSlots = {};

		InputSlots.slotToPeriodicity = function(slot) {
			var regexps = [
				/^_total$/,
				/^\d{4}$/,
				/^\d{4}\-Q\d$/,
				/^\d{4}\-\d{2}$/,
				/^\d{4}\-W\d{2}$/,
				/^\d{4}\-\d{2}\-\d{2}$/
				];

			console.log(regexps)
			var index = regexps.findIndex(function(regexp) { return slot.match(regexp); });

			return index !== -1 ? ['total', 'year', 'quarter', 'month', 'week', 'day'][index] : null;
		};

		InputSlots.dateToSlot = function(date, periodicity) {
			switch (periodicity) {
				case 'year':
					return date.getUTCFullYear().toString();

				case 'quarter':
					return date.getUTCFullYear().toString() + '-Q' + (1 + Math.floor(date.getUTCMonth() / 3)).toString();

				case 'month':
					return date.toISOString().substring(0, 7);

				case 'week':
					return date.getUTCISOWeekYear().toString() + '-W' + date.getUTCISOWeek().toString();

				case 'day':
					return date.toISOString().substring(0, 10);
			}

			throw new Error('Invalid periodicity.');
		};

		InputSlots.slotToDate = function(slot) {
			switch (InputSlots.slotToPeriodicity(slot)) {
				case 'year':
					return new Date(slot + '-01-01T00:00:00Z');

				case 'quarter':
					var month = (slot.substring(7, 8) - 1) * 3 + 1;
					if (month < 10)
						month = '0' + month;

					return new Date(slot.substring(0, 5) + month + '-01T00:00:00Z');

				case 'month':
					return new Date(slot + '-01T00:00:00Z');

				case 'week':
					// 

					return 'coucou';

				case 'day':
					return new Date(slot + 'T00:00:00Z');
			}

			throw new Error("Invalid slot");
		};

		InputSlots.slotToFormat = function(slot) {
			switch (InputSlots.slotToPeriodicity(slot)) {
				case 'total':
					return "Total";

				case 'year':
					return slot;

				case 'quarter':
					if ($rootScope.language == 'fr') {
						var trim = {"1": "1er", "2": "2ème", "3": "3ème", "4": "4ème"}
						return trim[slot.substring(6)] + ' trimestre ' + slot.substring(0, 4);
					}
					else if ($rootScope.language == 'es') {
						var trim = {"1": "Primer", "2": "Segundo", "3": "Tercero", "4": "Quarto"}
						return trim[slot.substring(6)] + ' trimestre ' + slot.substring(0, 4);
					}
					else
						return slot;

				case 'month':
					return $locale.DATETIME_FORMATS.STANDALONEMONTH[slot.substring(5, 7) - 1] + ' ' + slot.substring(0, 4);

				case 'week':
					return slot;

				case 'day':
					return $filter('date')(new Date(slot + 'T00:00:00Z'), 'mediumDate', 'utc');
			}

			throw new Error();
		};

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

		return InputSlots;
	})

	.filter('formatSlot', function(InputSlots) {
		return InputSlots.slotToFormat;
	});



