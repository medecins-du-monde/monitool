


reportingServices.factory('mtCompute', function() {

	/**
	 * This method computes the leafs on the tree used to compute indicators from the raw data.
	 */
	var computeIndicatorsLeafsFromRaw = function(rawData, form) {
		var processField = function(field, raw) {
			var result;

			// We need to sum filters.
			if (field.type === 'raw') {
				result = 0;

				try {
					// we support not defining any filter for simple fields.
					if (!field.filter || !Array.isArray(field.filter) || field.filter.length == 0)
						result = raw[field.rawId];
					else
						field.filter.forEach(function(filterInstance) {
							var v = raw[field.rawId];
							if (Array.isArray(filterInstance))
								// filters can be as long as they want, which is not the case IRL
								filterInstance.forEach(function(f) { v = v[f]; });
							else
								// is the filter is not an array we assume that we can just get the data.
								v = v[filterInstance];

							// v may be undefined or null if the field was not filled.
							// we just ignore it in that case.
							if (typeof v == 'number')
								result += v;
						});
				}
				catch (e) {
					console.log(e); // leave this for now.
				}
			}

			// We just create a branch recurse
			else if (field.type === 'formula') {
				result = {};
				for (var key in field.parameters)
					result[key] = processField(field.parameters[key], raw);
			}
			else
				throw new Error('Invalid field type.');

			return result;
		};

		var computed = {count: 1};
		
		form.fields.forEach(function(field) {
			computed[field.indicatorId] = processField(field, rawData);
		});

		return computed;
	};

	var computeIndicatorsFromLeafs = function(computed, form, indicatorsById) {
		var processField = function(field, raw) {
			// A raw field is already computed, by nature.
			if (field.type === 'raw')
				return raw;
			
			// We need to compute formulas.
			else if (field.type === 'formula') {
				var localScope = {};
				for (var key in field.parameters) {
					localScope[key] = processField(field.parameters[key], raw[key], indicatorsById);

					// Early quit if one of the parameters is missing.
					if (localScope[key] === 'AGG_CONFLICT')
						return 'AGG_CONFLICT';
				}

				var formula = indicatorsById[field.indicatorId].formulas[field.formulaId];
				try {
					return Parser.evaluate(formula.expression, localScope);
				}
				catch (e) { } // the function will return undefined, which is what we want.
			}
			else
				throw new Error('Invalid field type.');
		};

		var result = {};

		form.fields.forEach(function(field) {
			result[field.indicatorId] = processField(field, computed[field.indicatorId]);
		});

		return result;
	};

	return {
		computeIndicatorsFromLeafs: computeIndicatorsFromLeafs,
		computeIndicatorsLeafsFromRaw: computeIndicatorsLeafsFromRaw,
	};
});

