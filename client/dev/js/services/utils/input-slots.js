"use strict";

angular
	.module('monitool.services.utils.input-slots', [])

	.factory('InputSlots', function() {
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

		return InputSlots;
	})

	.filter('formatSlot', function($rootScope, $locale, $filter) {
		return function(slot) {
			if (slot == '_total')
				return 'Total';

			else {
				var year = slot.match(/^\d{4}$/);
				if (year)
					return year[0];

				else {
					var quarter = slot.match(/^(\d{4})\-Q(\d)$/);
					if (quarter) {
						if ($rootScope.language == 'fr') {
							var trim = {"1": "1er", "2": "2ème", "3": "3ème", "4": "4ème"}
							return trim[quarter[2]] + ' trimestre ' + quarter[1];
						}
						else if ($rootScope.language == 'es') {
							var trim = {"1": "Primer", "2": "Segundo", "3": "Tercero", "4": "Quarto"}
							return trim[quarter[2]] + ' trimestre ' + quarter[1];
						}
						else
							return slot;
					}
					else {
						var month = slot.match(/^(\d{4})\-(\d{2})$/);
						if (month)
							return $locale.DATETIME_FORMATS.STANDALONEMONTH[month[2] - 1] + ' ' + month[1];
						else
							return $filter('date')(new Date(slot + 'T00:00:00Z'), 'mediumDate', 'utc');
					}

				}
			}

			return 'failed'
		};
	});



