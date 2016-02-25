

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

					doc.logicalFrames.forEach(function(logicalFrame) {
						logicalFrame.indicators.forEach(function(indicator) {
							if (indicator.indicatorId)
								emit(indicator.indicatorId, "project_on_indicator");
						});

						logicalFrame.purposes.forEach(function(purpose) {
							purpose.indicators.forEach(function(indicator) {
								if (indicator.indicatorId)
									emit(indicator.indicatorId, "project_on_indicator");
							});

							purpose.outputs.forEach(function(output) {
								output.indicators.forEach(function(indicator) {
									if (indicator.indicatorId)
										emit(indicator.indicatorId, "project_on_indicator");
								});
							});
						});
					});
				}
				else if (doc.type === 'input') {
					emit(doc.project, 'input_on_project');
					emit(doc.form, 'input_on_form');
					emit(doc.entity, 'input_on_entity');
				}

			}.toString(),
			reduce: '_count'
		}
	}
};


