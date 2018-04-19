import database from '../database';

/**
 * Prefix all ids with their types
 */
export default async function() {
	let result = await database.callList({include_docs: true});
	let documents = [];

	result.rows.forEach(row => {
		if (row.id === 'version') {
			return;
		}
		else if (row.id === '_design/monitool') {
			return;
		}
		else {
			// Delete document.
			documents.push({_id: row.id, _rev: row.doc._rev, _deleted: true});

			// Create new record with the prefix in the id.
			if (row.doc.type === 'user')
				row.doc._id = 'user:' + row.id.substring(4);
			else {

				if (row.doc.type === 'project') {
					row.doc._id = 'project:' + row.id;

					// themes
					row.doc.themes = row.doc.themes.map(id => 'theme:' + id);

					// indicators
					let newcc = {};
					for (let key in row.doc.crossCutting)
						newcc['indicator:' + key] = row.doc.crossCutting[key];
					row.doc.crossCutting = newcc;

					// users
					row.doc.users.forEach(user => {
						if (user.id)
							user.id = 'user:' + user.id.substring(4);

					});
				}
				else if (row.doc.type === 'input') {
					row.doc._id = 'input:project:' + row.id;
					row.doc.project = 'project:' + row.doc.project;
				}
				else if (row.doc.type === 'indicator') {
					row.doc._id = 'indicator:' + row.id;
					row.doc.themes = row.doc.themes.map(id => 'theme:' + id);
				}
				else
					row.doc._id = row.doc.type + ':' + row.id;
			}

			delete row.doc._rev;
		}

		documents.push(row.doc);
	});

	return database.callBulk({docs: documents});
};
