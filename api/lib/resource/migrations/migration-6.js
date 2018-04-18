import database from '../database';

/**
 * this migration add the missing "dataSources" field on all projects.
 */
export default async function() {
	let result = await database.callView('by_type', {include_docs: true, key: 'project'});
	let documents = [];

	result.rows.forEach(row => {
		var update = false;
		var project = row.doc;

		project.logicalFrames.forEach(logframe => {
			logframe.start = logframe.end = null;
		});

		if (update)
			documents.push(project);
	});

	return database.callBulk({docs: documents});
};
