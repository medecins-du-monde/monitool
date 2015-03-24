


reportingServices.factory('mtCompute', function() {

	/**
	 * This method will ensure that an input has a valid format against
	 * a given form by removing all entries that are not explicitely defined in the form.
	 */
	var sanitizeRawData = function(values, form) {
		var elementsById = {};
		for (var i = 0, numSections = form.rawData.length; i < numSections; ++i)
			for (var j = 0, numElements = form.rawData[i].elements.length; j < numElements; ++j)
				elementsById[form.rawData[i].elements[j].id] = form.rawData[i].elements[j];

		for (var elementId in values) {
			if (elementId !== 'count') {
				var element = elementsById[elementId],
					value   = values[elementId];

				if (!element)
					delete values[elementId];

				var numPartitions1 = element.partition1.length,
					numPartitions2 = element.partition2.length,
					p1, p2;
				
				if (numPartitions1 && numPartitions2) {
					if (typeof value !== 'object')
						delete values[elementId];

					else for (p1 in value) {
						// if the partition does not exists or is not a hashmap
						if (!element.partition1.find(function(p) { return p.id === p1; }) || typeof value[p1] !== 'object')
							delete value[p1];

						else for (p2 in value[p1])
							// if the partition does not exists or is not a number
							if (!element.partition2.find(function(p) { return p.id === p2; }) || typeof value[p1][p2] !== 'number')
								delete value[p1][p2];
					}
				}
				else if (numPartitions1) {
					if (typeof value !== 'object')
						delete values[elementId];

					else for (p1 in value)
						// if the partition does not exists or is not a number
						if (!element.partition1.find(function(p) { return p.id === p1; }) || typeof value[p1] !== 'number')
							delete value[p1];
				}
				else {
					if (typeof value !== "number")
						delete values[elementId];
				}
			}
		}
	};


	var _processFieldLeafs = function(field, raw) {
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
				result[key] = _processFieldLeafs(field.parameters[key], raw);
		}
		else if (field.type === 'zero')
			result = 0;
		else
			throw new Error('Invalid field type.');

		return result;
	};

	var _processFieldComp = function(field, raw, indicatorsById) {
		// A raw field is already computed, by nature.
		if (field.type === 'raw' || field.type === 'zero')
			return raw;
		
		// We need to compute formulas.
		else if (field.type === 'formula') {
			var localScope = {};
			for (var key in field.parameters) {
				localScope[key] = _processFieldComp(field.parameters[key], raw[key], indicatorsById);

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

	/**
	 * This method computes the leafs on the tree used to compute indicators from the raw data.
	 * This is computed by input, before grouping
	 */
	var computeIndicatorsLeafsFromRaw = function(rawData, form) {
		var computed = {count: 1};
		
		form.fields.forEach(function(field) {
			computed[field.indicatorId] = _processFieldLeafs(field, rawData);
		});

		return computed;
	};

	/**
	 * This method computes the indicators from the leafs.
	 * This may be called on inputs directly, but is usually used with regrouped results.
	 */
	var computeIndicatorsFromLeafs = function(computed, form, indicatorsById) {
		var result = {};

		form.fields.forEach(function(field) {
			result[field.indicatorId] = _processFieldComp(field, computed[field.indicatorId], indicatorsById);
		});

		return result;
	};

	return {
		sanitizeRawData: sanitizeRawData,
		computeIndicatorsFromLeafs: computeIndicatorsFromLeafs,
		computeIndicatorsLeafsFromRaw: computeIndicatorsLeafsFromRaw,
	};
});



