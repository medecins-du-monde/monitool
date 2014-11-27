
var reduceInputs = function(keys, values, rereduce) {
	var memo = {},
		numValues = values.length;

	for (var i = 0; i < numValues; ++i) {
		var value = values[i];
		for (var key in value)
			if (memo[key])
				memo[key] += value[key];
			else
				memo[key] = value[key];
	}

	return memo;
}.toString();


module.exports = {
	_id: '_design/reporting',

	views: {
		// For project by X stats and inputGroup by X stats
		inputs_by_project_year_month_entity: {
			map: function(doc) {
				if (doc.type === 'input') {
					var p = doc.period.split('-');
					emit([doc.project, p[0], p[1], doc.entity], doc.indicators);
				}
			}.toString(),
			reduce: reduceInputs
		},

		// For input entity by X stats
		inputs_by_entity_year_month: {
			map: function(doc) {
				if (doc.type === 'input') {
					var p = doc.period.split('-');
					emit([doc.entity, p[0], p[1]], doc.indicators);
				}
			}.toString(),
			reduce: reduceInputs
		}
	}
};
