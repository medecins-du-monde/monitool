import database from '../database';
import uuid from 'node-uuid';

/**
 * This migration removes the fake "none" entity used to attach data
 * directly to the project.
 * The same effect is obtained by creating a fake collection site.
 */
export default function() {
	var view = 'by_type',
		opt = {include_docs: true, key: 'project'};

	return Promise.all([
		database.callView('by_type', {include_docs: true, key: 'project'}),
		database.callView('by_type', {include_docs: true, key: 'input'})
	]).then(function(result) {
		var projectResult = result[0], inputResult = result[1];
		var documents = [];
		var projectUUIDs = {};

		// Start by updating projects.
		projectResult.rows.forEach(function(row) {
			var update = false, hasProjectLevelForms = false;
			var project = row.doc;

			projectUUIDs[project._id] = uuid.v4();

			project.forms.forEach(function(form) {
				if (form.collect === 'project') {
					hasProjectLevelForms = true;
					form.entities = [projectUUIDs[project._id]];
				}
				else if (form.collect === 'entity') {
					form.entities = project.entities.map(entity => entity.id)
				}

				delete form.collect;
				update = true;
			});

			project.users.forEach(function(user) {
				if (user.role === 'input') {
					var index = user.entities.indexOf('none');

					if (index !== -1) {
						if (hasProjectLevelForms)
							user.entities.splice(index, 1, projectUUIDs[project._id]);
						else
							user.entities.splice(index, 1);
					}
				}
			});

			if (hasProjectLevelForms)
				project.entities.unshift({id: projectUUIDs[project._id], name: "Project", start: null, end: null});

			if (update)
				documents.push(project);
		});

		// Then inputs.
		inputResult.rows.forEach(function(row) {
			var input = row.doc;

			if (input.entity === 'none') {
				// delete input.
				documents.push({_id: input._id, _rev: input._rev, _deleted: true});

				// create a new one with the good data.
				input.entity = projectUUIDs[input.project];
				input._id = [input.project, input.entity, input.form, input.period].join(':');

				delete input._rev;
				documents.push(input);
			}
		});

		return database.callBulk({docs: documents});
	});
};
