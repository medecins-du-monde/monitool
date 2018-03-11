import database from '../database';

/**
 * this migration add the missing "dataSources" field on all users.
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
				if (user.role === 'input') {
					user.dataSources = project.forms.map(f => f.id);
					update = true;
				}
			});

			if (update)
				documents.push(project);
		});

		return database.callBulk({docs: documents});
	});
};
