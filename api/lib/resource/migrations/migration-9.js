import database from '../database';

/**
 * Add structure to all inputs to make it possible to update them at fetch time.
 */
export default async function() {
	let projects = await database.callView('by_type', {include_docs: true, key: 'project'}),
		inputs = await database.callView('by_type', {include_docs: true, key: 'input'});

	inputs.rows.forEach(row => {
		let input = row.doc,
			project = projects.rows.find(row => row.id === input.project).doc,
			dataSource = project.forms.find(ds => ds.id === input.form);

		input.structure = {};

		dataSource.elements.forEach(e => {
			input.structure[e.id] = e.partitions.map(partition => {
				return {
					id: partition.id,
					items: partition.elements.map(pe => pe.id),
					aggregation: partition.aggregation
				};
			});
		});
	});

	let docsToUpdate = inputs.rows.map(row => row.doc);

	projects.rows.forEach(row => {
		let project = row.doc;
		let update = false;

		project.forms.forEach(form => {
			form.elements.forEach(element => {
				element.partitions.forEach(partition => {
					if (partition.aggregation === 'none') {
						partition.aggregation = 'sum';

						update = true;
						console.log(project._id, project.country, project.name);
					}
				});
			});
		});

		if (update)
			docsToUpdate.push(project);
	});

	return database.callBulk({docs: docsToUpdate});
};

