import database from '../database';

/**
 * this migration add the missing "dataSources" field on all projects.
 */
export default async function() {
	let result = await database.callView('by_type', {include_docs: true, key: 'project'});

	result.rows.forEach(row => {
		row.doc.logicalFrames.forEach(logframe => {
			logframe.start = logframe.end = null;
		});
	});

	return database.callBulk({docs: result.rows.map(row => row.doc)});
};
