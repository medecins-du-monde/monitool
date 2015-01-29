

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
				if (doc.type === 'indicator')
					doc.themes.forEach(function(typeId) { emit(typeId); });

			}.toString(),
			reduce: '_count'
		},

		// query(indicator) => returns the list of all indicators and project that use it.
		reverse_dependencies: {
			map: function(doc) {
				if (doc.type === 'indicator') {
					// theme & type dependencies
					doc.themes.forEach(function(id) { emit(id); });
					doc.types.forEach(function(id) { emit(id); });

					// indicator dependencies
					for (var formulaId in doc.formulas)
						for (var key in doc.formulas[formulaId].parameters)
							emit(doc.formulas[formulaId].parameters[key]);
				}
				else if (doc.type === 'project') {
					// user deps
					doc.owners.forEach(function(name) { emit(name); });
					doc.dataEntryOperators.forEach(function(name) { emit(name); });

					// indicator deps
					Object.keys(indicators).forEach(function(id) { emit(id); });

					// formula deps (we need to recurse)
					var traverse = function(field) {
						if (field.type.substring(0, 'compute:'.length) === 'compute:') {
							emit(field.type.substring('compute:'.length));

							for (var key in field.parameters)
								traverse(field.parameters[key]);
						}
					};

					doc.dataCollection.forEach(function(form) {
						form.fields.forEach(traverse);
					});
				}
				else if (doc.type === 'input') {

				}

			}.toString(),
			reduce: '_count'
		}
	}
};
