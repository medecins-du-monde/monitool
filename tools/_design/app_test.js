
module.exports = {
	_id: '_design/test',

	views: {

		theme_type_tree: {
			map: function(doc) {
				if (doc.type !== 'indicator')
					return;

				doc.themes.forEach(function(theme) {
					doc.types.forEach(function(type) {
						emit([theme, type, doc.name]);
					});
				});
			}.toString(),

			reduce: "_count"
		},

		project_usage: {
			map: function(doc) {
				if (doc.type !== 'project')
					return;

				for (var indicatorId in doc.indicators)
					emit(indicatorId);
			}.toString(),

			reduce: "_count"
		},

		input_usage: {
			map: function(doc) {
				if (doc.type !== 'input')
					return;

				for (var indicatorId in doc.indicators)
					emit(indicatorId);
			}.toString(),

			reduce: "_count"
		}
	}
};
