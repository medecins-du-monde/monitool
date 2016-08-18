"use strict";

angular
	.module('monitool.services.utils.input-slots', [])

	.service('InputSlots', function() {
		var formats = {year: 'YYYY', quarter: 'YYYY-[Q]Q', month: 'YYYY-MM', week: 'YYYY-[W]WW', day: 'YYYY-MM-DD'};

		var getFirstDate = this.getFirstDate = function(project, entity, form) {
			var formPeriodicity = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

			if (entity) {
				if (!entity.start && !form.start)
					return moment.utc(project.start).startOf(formPeriodicity);
				else if (!entity.start && form.start)
					return moment.utc(form.start).startOf(formPeriodicity);
				else if (entity.start && !form.start)
					return moment.utc(entity.start).startOf(formPeriodicity);
				else
					return moment.max(moment.utc(entity.start), moment.utc(form.start)).startOf(formPeriodicity);
			}
			else
				return moment.utc(form.start || project.start).startOf(formPeriodicity);
		};

		var getLastDate = this.getLastDate = function(project, entity, form) {
			var formPeriodicity = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

			if (entity) {
				if (!entity.end && !form.end)
					return moment.utc(project.end).startOf(formPeriodicity);
				else if (!entity.end && form.end)
					return moment.utc(form.end).startOf(formPeriodicity);
				else if (entity.end && !form.end)
					return moment.utc(entity.end).startOf(formPeriodicity);
				else
					return moment.min(moment.utc(entity.end), moment.utc(form.end)).startOf(formPeriodicity);
			}
			else
				return moment.utc(form.end || project.end).startOf(formPeriodicity);
		};

		var getListDate = this.getListDate = function(project, entity, form) {
			var periods;

			if (['year', 'quarter', 'month', 'week', 'day'].indexOf(form.periodicity) !== -1) {
				var current = getFirstDate(project, entity, form),
					end = getLastDate(project, entity, form);

				if (end.isAfter()) // do not allow to go in the future
					end = moment.utc();

				periods = [];
				while (current.isBefore(end)) {
					periods.push(current.clone());
					current.add(1, form.periodicity);
				}
			}
			else if (form.periodicity === 'free') {
				periods = [];
			}
			else
				throw new Error(form.periodicity + ' is not a valid periodicity');

			return periods;
		};

		var getFirst = this.getFirst = function(project, entity, form) {
			return getFirstDate(project, entity, form).format(formats[form.periodicity]);
		};

		var getLast = this.getLast = function(project, entity, form) {
			return getLastDate(project, entity, form).format(formats[form.periodicity]);
		};

		var getList = this.getList = function(project, entity, form) {
			return getListDate(project, entity, form).map(function(date) {
				return date.format(formats[form.periodicity]);
			});
		};
	})

	.filter('formatSlot', function() {
		return function(slot) {
			return slot;
		};
	});



