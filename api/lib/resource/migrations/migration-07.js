import database from '../database';

/**
 * Add "visibility" field on projects.
 */
export default async function() {
	let ddoc = await database.get('_design/monitool')

	ddoc.views.projects_short = {
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
					themes: doc.themes,
					visibility: doc.visibility
				});
			}
		}.toString()
	};

	ddoc.views.projects_public = {
		map: function(doc) {
			if (doc.type === 'project' && doc.visibility === 'public')
				emit();

		}.toString()
	};

	ddoc.views.projects_private = {
		map: function(doc) {
			if (doc.type === 'project' && doc.visibility === 'private')
				doc.users.forEach(function(user) {
					if (user.id)
						emit(user.id);
				});
		}.toString()
	};

	await database.insert(ddoc);

	let result = await database.callView('by_type', {include_docs: true, key: 'project'});
	let documents = [];

	result.rows.forEach(row => {
		var project = row.doc;

		if (!project.visibility) {
			project.visibility = 'public';
			documents.push(project);
		}
	});

	return database.callBulk({docs: documents});
};
