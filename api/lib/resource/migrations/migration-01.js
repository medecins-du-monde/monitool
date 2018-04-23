import database from '../database';

/**
 * This migration replaces user that had the permission "input_all",
 * by user with the permission "input", but with all entities.
 */
export default async () => {
	const result = await database.callView('by_type', {include_docs: true, key: 'project'});
	const documents = [];

	result.rows.forEach(row => {
		const project = row.doc;
		let update = false;

		project.users.forEach(user => {
			if (user.role === 'input_all') {
				user.role = 'input';
				user.entities = ["none"].concat(project.entities.map(entity => entity.id));
				update = true;
			}
		});

		if (update)
			documents.push(project);
	});

	return database.callBulk({docs: documents});
};
