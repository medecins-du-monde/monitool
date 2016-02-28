
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

		inputs_by_project_date: {
			map: function(doc) {
				if (doc.type === 'input')
					emit([doc.project, doc.period]);
			}.toString()
		},

		inputs_by_entity_date: {
			map: function(doc) {
				if (doc.type === 'input')
					emit([doc.entity, doc.period]);
			}.toString()
		},

		inputs_by_form_date: {
			map: function(doc) {
				if (doc.type === 'input')
					emit([doc.form, doc.period]);
			}.toString()
		},

		report_by_project: {
			map: function(doc) {
				if (doc.type === 'report')
					emit([doc.project, doc.date], doc.name);
			}.toString()
		}
	}
};
