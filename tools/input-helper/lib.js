"use strict";

var moment = require('moment');

module.exports = {

	getPeriods: function(form, project) {
		var periods;
		if (['year', 'quarter', 'month', 'week', 'day'].indexOf(form.periodicity) !== -1) {
			var period = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

			var current = moment(form.useProjectStart ? project.begin : form.begin).startOf(period),
				end     = moment(form.useProjectEnd ? project.end : project.end).endOf(period);

			if (end.isAfter()) // do not allow to go in the future
				end = moment();

			periods = [];
			while (current.isBefore(end)) {
				periods.push(current.clone());
				current.add(1, form.periodicity);
			}
		}
		else if (form.periodicity === 'planned') {
			periods = form.intermediaryDates.map(function(period) {
				return moment(period);
			});
			periods.unshift(moment(form.start));
			periods.push(moment(form.end));
		}
		else
			throw new Error(form.periodicity + ' is not a valid periodicity');

		return periods;
	},

	getFields: function(form, indicatorsById) {
		function getInputRows(prefix, indicatorId, field, indicatorsById) {
			if (field.type === 'input')
				return [{id: indicatorId, path: prefix, name: indicatorsById[indicatorId].name }];

			else if (field.type.substring(0, 4) === 'link')
				return [];

			else if (field.type.substring(0, 7) === 'compute') {
				var indicator = indicatorsById[indicatorId],
					formulaId = field.type.substring(8);

				var result = [];
				for (var key in field.parameters) {
					var childPrefix = prefix + '.' + key,
						childId     = indicator.formulas[formulaId].parameters[key];

					result = result.concat(getInputRows(childPrefix, childId, field.parameters[key], indicatorsById));
				}
				return result;
			}
		};
		
		var fields = [];
		
		form.fields.forEach(function(field) {
			fields = fields.concat(getInputRows(field.id, field.id, field, indicatorsById));
		});

		return fields;
	}
};
