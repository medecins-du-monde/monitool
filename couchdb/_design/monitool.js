

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
	_id: '_design/monitool',

	// "shows": {
	// 	"project": function(doc, req) {0
	// 		return doc.name + ' is a capital project for our goal!';
	// 	}.toString()
	// },

	// "lists": {
	// 	"by_type": function(head, req) {
	// 		var row;
	// 		while (row = getRow())
	// 			if (row.value)
	// 				send(row.value.name + "\n");
	// 	}.toString()
	// },

	// "updates": {
	// 	"make_stupid": function(doc, req) {
	// 		doc.name = 'Stupid ' + doc.name;
	// 		return [doc, toJSON(doc)];
	// 	}.toString(),
	// },

	filters: {
		offline: function(doc, request) {
			if (doc.type === 'type' || doc.type === 'theme' || doc.type === 'indicator' || doc._id === '_design/monitool')
				return true;
			else if (request.query.projects) {
				try {
					var ids = JSON.parse(request.query.projects);
					if (doc.type === 'project')
						return request.query.projects.indexOf(doc._id);
					else if (doc.type === 'input')
						return request.query.projects.indexOf(doc.project);
					else
						return false;
				}
				catch (e) {
					return false;
				}
			}
			else
				return false;
		}.toString()
	},

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
					emit(doc._id, {name: doc.name, standart: doc.standart, types: doc.types, themes: doc.themes});

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
						memo.standart = value.standart;
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
