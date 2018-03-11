import database from '../database';

/**
 * This migration replaces user that had the permission "input_all",
 * by user with the permission "input", but with all entities.
 */
export default function() {
	var view = 'by_type',
		opt = {include_docs: true, key: 'project'};

	return database.callView(view, opt).then(function(result) {
		var documents = [];

		result.rows.forEach(function(row) {
			var update = false;
			var project = row.doc;

			project.users.forEach(function(user) {
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
	});
};
