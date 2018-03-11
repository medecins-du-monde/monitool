
import database from '../database';

const getDesignDoc = function() {
	let ddoc = {
		_id: '_design/monitool',

		views: {
			inputs_by_project_date: {
				map: function(doc) {
					if (doc.type === 'input')
						emit([doc.project, doc.period]);
				}
			},

			inputs_by_project_entity_date: {
				map: function(doc) {
					if (doc.type === 'input')
						emit([doc.project, doc.entity, doc.period]);
				}
			},

			inputs_by_project_form_date: {
				map: function(doc) {
					if (doc.type === 'input')
						emit([doc.project, doc.form, doc.period]);
				}
			},

			project_by_theme: {
				map: function(doc) {
					if (doc.type === 'project')
						doc.themes.forEach(function(themeId) {
							emit(themeId);
						});
				}
			},

			indicator_by_theme: {
				map: function(doc) {
					if (doc.type === 'indicator')
						doc.themes.forEach(function(themeId) {
							emit(themeId);
						});
				}
			},

			cross_cutting: {
				map: function(doc) {
					if (doc.type === 'project')
						for (var indicatorId in doc.crossCutting)
							emit(indicatorId);
				}
			},

			themes_usage: {
				map: function(doc) {
					if (doc.type === 'indicator' || doc.type === 'project')
						doc.themes.forEach(function(themeId) { emit([themeId, doc.type]); });

				},
				reduce: '_count'
			},

			by_type: {
				map: function(doc) {
					emit(doc.type);
				}
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
				}
			},

			// listings
			projects_short: {
				map: function(doc) {
					if (doc.type === 'project') {
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
					}
				}
			}
		}
	};

	for (var key in ddoc.views)
		ddoc.views[key].map = ddoc.views[key].map.toString();

	return ddoc;
}


/**
 * This migration creates the initial design doc.
 */
export default function() {
	return database.insert(getDesignDoc());
};
