

var reduceTypeTheme = function(keys, values, rereduce) {
	var memo      = {usage: 0},
		numValues = values.length;

	for (var i = 0; i < numValues; ++i) {
		var value = values[i];
		if (value.usage)
			memo.usage += value.usage;
		if (value.name)
			memo.name = value.name;
	}

	return memo;
}.toString();

module.exports = {
	_id: '_design/shortlists',

	views: {
		// secondary key
		projects_by_indicator: {
			map: function(doc) {
				if (doc.type === 'project')
					for (var indicatorId in doc.indicators)
						emit(indicatorId);
			}.toString()
		},

		// listings
		projects_short: {
			map: function(doc) {
				if (doc.type === 'project')
					emit(doc._id, {name: doc.name, begin: doc.begin, end: doc.end, owners: doc.owners, dataEntryOperators: doc.dataEntryOperators});
			}.toString()
		},

		indicators_short: {
			map: function(doc) {
				if (doc.type === 'indicator')
					emit(doc._id, {name: doc.name, standard: doc.standard});
			}.toString()
		},
		
		types_short: {
			map: function(doc) {
				if (doc.type === 'indicator')
					doc.types.forEach(function(typeId) {
						emit(typeId, {usage: 1});
					});
				
				else if (doc.type === 'type')
					emit(doc._id, {name: doc.name});

			}.toString(),
			reduce: reduceTypeTheme
		},

		themes_short: {
			map: function(doc) {
				if (doc.type === 'indicator')
					doc.themes.forEach(function(themeId) {
						emit(themeId, {usage: 1});
					});
				else if (doc.type === 'theme')
					emit(doc._id, {name: doc.name});
			}.toString(),
			reduce: reduceTypeTheme
		},

		// indicator tree
		indicator_full_tree: {
			map: function(doc) {
				if (doc.type === 'indicator') {
					var newDoc = {name: doc.name, standard: doc.standard};

					if (doc.themes.length === 0 && doc.types.length === 0)
						emit(['', ''], newDoc);
					else if (doc.themes.length === 0 && doc.types.length !== 0)
						doc.types.forEach(function(type) { emit(['', type], newDoc); });
					else if (doc.themes.length !== 0 && doc.types.length === 0)
						doc.themes.forEach(function(theme) { emit([theme, ''], newDoc); });
					else
						doc.themes.forEach(function(theme) {
							doc.types.forEach(function(type) {
								emit([theme, type], newDoc);
							});
						});
				}
			}.toString(),

			reduce: "_count"
		},

		indicator_partial_tree: {
			map: function(doc) {
				if (doc.type === 'indicator' && doc.standard) {
					var newDoc = {name: doc.name, standard: doc.standard};

					if (doc.themes.length === 0 && doc.types.length === 0)
						emit(['', ''], newDoc);
					else if (doc.themes.length === 0 && doc.types.length !== 0)
						doc.types.forEach(function(type) { emit(['', type], newDoc); });
					else if (doc.themes.length !== 0 && doc.types.length === 0)
						doc.themes.forEach(function(theme) { emit([theme, ''], newDoc); });
					else
						doc.themes.forEach(function(theme) {
							doc.types.forEach(function(type) {
								emit([theme, type], newDoc);
							});
						});
				}
			}.toString(),

			reduce: "_count"
		},

		indicator_usage: {
			map: function(doc) {
				var indicatorId;

				if (doc.type === 'project')
					for (indicatorId in doc.indicators)
						emit('main:' + indicatorId);
				
				if (doc.type === 'input')
					for (indicatorId in doc.indicators)
						emit('input:' + indicatorId);
			}.toString(),

			reduce: "_count"
		}
	}
};
