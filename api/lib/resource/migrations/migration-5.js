import database from '../database';

/**
 * this migration add the missing "dataSources" field on all projects.
 */
export default async function() {
	var view = 'by_type',
		opt = {include_docs: true, key: 'project'};

	let result = await database.callView(view, opt);
	let documents = [];

	result.rows.forEach(row => {
		var update = false;
		var project = row.doc;

		project.logicalFrames.forEach(logframe => {
			logframe.purposes.forEach(purpose => {
				purpose.outputs.forEach(output => {
					output.activities = [];
					update = true;
				});
			});
		});

		if (update)
			documents.push(project);
	});

	return database.callBulk({docs: documents});
};
