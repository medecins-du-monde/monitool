

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
					emit(doc._id, {name: doc.name, begin: doc.begin, end: doc.end});
			}.toString()
		},

		indicators_short: {
			map: function(doc) {
				if (doc.type === 'project') {
					var main = {}, dependency = {}, indicatorId = null;

					for (indicatorId in doc.indicators)
						main[indicatorId] = true;

					var numForms = doc.dataCollection.length;
					for (var i = 0; i < numForms; ++i)
						for (indicatorId in doc.dataCollection[i].fields)
							if (!main[indicatorId])
								dependency[indicatorId] = true;

					for (indicatorId in main)
						emit(indicatorId, {main: 1});

					for (indicatorId in dependency)
						emit(indicatorId, {dependency: 1});
				}
				else if (doc.type === 'indicator')
					emit(doc._id, {name: doc.name, standard: doc.standard, types: doc.types, themes: doc.themes});

				// this may be a bit overkill
				else if (doc.type === 'input')
					for (var indicatorId in doc.indicators)
						emit(indicatorId, {input: 1});
			}.toString(),

			reduce: function(keys, values, rereduce) {
				var memo      = {main: 0, dependency: 0, input: 0},
					numValues = values.length;

				for (var i = 0; i < numValues; ++i) {
					var value = values[i];

					if (value.name) {
						memo.name     = value.name;
						memo.standard = value.standard;
						memo.types    = value.types;
						memo.themes   = value.themes;
					}

					value.main       && (memo.main       += value.main);
					value.dependency && (memo.dependency += value.dependency);
					value.input      && (memo.input      += value.input);
				}

				return memo;
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

	}
};
