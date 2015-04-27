

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
		by_type: {
			map: function(doc) {
				emit(doc.type);
			}.toString()
		},

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
					emit(doc._id, {
						_id: doc._id,
						name: doc.name,
						begin: doc.begin, end: doc.end,
						owners: doc.owners, dataEntryOperators: doc.dataEntryOperators,
						themes: doc.themes
					});
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
		indicator_tree: {
			map: function(doc) {
				if (doc.type === 'indicator') {
					var themes     = [].concat(doc.themes),
						types      = [].concat(doc.types);

					themes.length == 0 && themes.push('');
					types.length  == 0 && types.push('');

					themes.forEach(function(theme) {
						types.forEach(function(type) {
							emit([theme, type], {_id: doc._id, name: doc.name, operation: doc.operation});
						});
					});
				}
			}.toString(),

			reduce: "_count"
		},

		indicator_usage: {
			map: function(doc) {
				if (doc.type === 'project')
					for (var indicatorId in doc.indicators)
						emit(indicatorId);
			}.toString(),

			reduce: "_count"
		}
	}
};
