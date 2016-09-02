

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

		partners: {
			map: function(doc) {
				if (doc.type === 'project') {
					doc.users.forEach(function(user) {
						if (user.type == 'partner') {
							emit(user.username, {
								type: 'partner',
								username: user.username,
								password: user.password,
								name: user.name,
								role: user.role,
								entities: user.entities,
								projectId: doc._id
							});
						}
					});
				}
			}.toString()
		},

		// listings
		projects_short: {
			map: function(doc) {
				if (doc.type === 'project')
					emit(doc._id, {
						_id: doc._id,
						country: doc.country,
						name: doc.name,
						start: doc.start, end: doc.end,
						users: doc.users.map(function(user) {
							return {type: user.type, id: user.id, username: user.username, role: user.role};
						}),
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
		}

	}
};
