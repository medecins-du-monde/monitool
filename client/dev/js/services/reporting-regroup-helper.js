
reportingServices.factory('mtRegroup', function() {

	var _dummySum = function(memo, obj) {
		for (var key in obj)
			if (typeof memo[key] === 'number')
				memo[key] += obj[key];
			else if (typeof memo[key] === 'string') // AGG_CONFLICT, or other errors.
				;
			else if (memo[key])
				_dummySum(memo[key], obj[key]);
			else
				memo[key] = angular.copy(obj[key]);
	};

	var _processRaw = function(value, count, indicatorAggregation) {
		// if there was only one input, we don't care how to avg/sum etc, and just return the value
		if (count > 1) {
			if (indicatorAggregation === 'average')
				return value / count;
			else if (indicatorAggregation === 'sum')
				return value;
			else if (indicatorAggregation === 'none')
				return 'AGG_CONFLICT';
			else
				throw new Error('Invalid aggregation type');
		}
		else
			return value;
	};


	/**
	 * This methods adds yearAgg, monthAgg, weekAgg, dayAgg, entityAgg and groupAgg fields for all inputs.
	 * Each field is an array that will tell us which columns this input belongs to (each input can belong to multiple columns)
	 */
	var computeAggregationFields = function(input, project) {
		// annotate each input with keys that will later tell the sumBy function how to aggregate the data.
		var period = moment(input.period);

		var result = {
			year:    ['total', period.format('YYYY')],
			quarter: ['total', period.format('YYYY-[Q]Q')],
			month:   ['total', period.format('YYYY-MM')],
			week:    ['total', period.format('YYYY-[W]WW')],
			day:     ['total', period.format('YYYY-MM-DD')]
		};

		// some inputs are linked to the projet => they don't have any entity field.
		if (input.entity !== 'none') {
			result.entity = ['total', input.entity];

			// no total here, groups may have a non-empty intersection.
			result.group = project.inputGroups.filter(function(group) {
				return group.members.indexOf(input.entity) !== -1;
			}).map(function(group) {
				return group.id;
			});
		}
		else {
			result.entity = ['total'];
			result.group = [];
		}

		return result;
	};

	/**
	 * Inputs must always come from the same form!!!!
	 * FIXME => this is wrong. We need tests!
	 */
	var regroupInputs = function(inputs, form, groupBy, indicatorsById) {
		var result  = {},
			aggType = ['year', 'quarter', 'month', 'week', 'day'].indexOf(groupBy) !== -1 ? 'timeAggregation' : 'geoAggregation';

		// start by dummy summing all inputs by their groupBy key
		inputs.forEach(function(input) {
			input.aggregation[groupBy].forEach(function(key) {
				if (!result[key])
					result[key] = {};
				_dummySum(result[key], input.compute);
			});
		});

		// Then we need to check the definition of the indicators!
		// - If we summed indicators that needed to be averaged we should correct it.
		// - If we summed indicators that are not summable, we need to delete them from the final result.
		for (var groupKey in result) {
			var computed = result[groupKey];

			form.fields.forEach(function(field) {
				var indicator = indicatorsById[field.indicatorId];

				if (field.type === 'formula') {
					var formula = indicator.formulas[field.formulaId];

					// we could iterate on either formula.parameters, field.parameters or result[groupKey][indicatorId].
					// field.parameter may be wrong though (if the form changed since the input was made).
					for (var key in formula.parameters) { 
						computed[field.indicatorId][key] = _processRaw(
							computed[field.indicatorId][key],	// value.
							computed.count,						// number of inputs that were aggregated to do this.
							formula.parameters[key][aggType]	// geoAggregation/timeAggregation
						);
					}
				}
				else if (field.type === 'raw')
					computed[field.indicatorId] = _processRaw(computed[field.indicatorId], computed.count, indicator[aggType])
			});
		}

		return result;
	};

	return {
		computeAggregationFields: computeAggregationFields,
		regroupInputs: regroupInputs,
	}
});

