

module.exports = {
	_id: '_design/server',

	views: {	
		
		types_usage: {
			map: function(doc) {
				if (doc.type === 'indicator') {
					doc.types.forEach(function(typeId) { emit(typeId); });
				}
			}.toString(),
			reduce: '_count'
		},

		themes_usage: {
			map: function(doc) {
				if (doc.type === 'indicator' || doc.type === 'project')
					doc.themes.forEach(function(themeId) { emit([themeId, doc.type]); });

			}.toString(),
			reduce: '_count'
		},

		reverse_dependencies: {
			map: function(doc) {
				if (doc.type === 'indicator') {
					doc.themes.forEach(function(id) { emit(id, "indicator_on_theme"); });
					doc.types.forEach(function(id) { emit(id, "indicator_on_type"); });
				}
				else if (doc.type === 'project') {
					var users = doc.owners.concat(doc.dataEntryOperators).sort(),
						numUsers = users.length;

					for (var i = 1; i < numUsers; ++i) {
						if (users[i - 1] == users[i]) {
							users.splice(i, 1);
							i--;
							numUsers--;
						}
					}
					
					users.forEach(function(name) {
						emit(name, "project_on_user");
					});

					for (var indicatorId in doc.indicators) {
						var indicatorMeta = doc.indicators[indicatorId];

						emit(indicatorId, "project_on_indicator");
						if (indicatorMeta.formula)
							emit(indicatorMeta.formula, 'project_on_formula');
					}
				}

			}.toString(),
			reduce: '_count'
		}
	}
};


