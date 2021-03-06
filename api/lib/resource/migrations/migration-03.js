import database from '../database';

/**
 * this migration add the missing "dataSources" field on all users.
 */
export default async () => {
	const result = await database.callView('by_type', {include_docs: true, key: 'project'});
	const documents = [];

	result.rows.forEach(row => {
		var update = false;
		var project = row.doc;

		project.users.forEach(user => {
			if (user.role === 'input') {
				user.dataSources = project.forms.map(f => f.id);
				update = true;
			}
		});

		if (update)
			documents.push(project);
	});

	return database.callBulk({docs: documents});
};
