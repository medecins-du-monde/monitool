import database from '../database';


const rotatePartitions = (partitions, order) => {
	let n = partitions.length,
		i = order;

	//////////
	// Compute of the n-th permutation of sequence range(i)
	//////////
	var j, k = 0,
		fact = [],
		perm = [];

	// compute factorial numbers
	fact[k] = 1;
	while (++k < n)
		fact[k] = fact[k - 1] * k;

	// compute factorial code
	for (k = 0; k < n; ++k) {
		perm[k] = i / fact[n - 1 - k] << 0;
		i = i % fact[n - 1 - k];
	}

	// readjust values to obtain the permutation
	// start from the end and check if preceding values are lower
	for (k = n - 1; k > 0; --k)
		for (j = k - 1; j >= 0; --j)
			if (perm[j] <= perm[k])
				perm[k]++;

	//////////
	// Map our partitions to the found permutation
	//////////
	return perm.map(index => partitions[index]);
};


const migrateInputs = async () => {
	// Load all projects (already updated).
	const dbResultProjects = await database.callView('by_type', {key: 'project', include_docs: true});
	const projectsById = {};
	dbResultProjects.rows.forEach(row => projectsById[row.id] = row.doc);

	// Update projects, and create revisions.
	const dbResults = await database.callView('by_type', {key: 'input'});
	const documents = [];

	for (let i = 0; i < dbResults.rows.length; ++i) {
		console.log('input', i, '/', dbResults.rows.length);

		const input = await database.get(dbResults.rows[i].id);
		const deleted = {_id: input._id, _rev: input._rev, _deleted: true};

		const dataSource = projectsById[input.project].forms.find(f => f.id === input.form);

		input._id = 'input:project:' + input.project + ":" + input.form + ":" + input.entity + ":" + input.period;
		delete input._rev;
		input.project = 'project:' + input.project;
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

		documents.push(deleted, input)


		if (documents.length > 40) {
			await database.callBulk({docs: documents});
			documents.length = 0
		}
	}

	await database.callBulk({docs: documents});
};


const updateProject = project => {
	// Add visibility
	project.visibility = 'public';

	project.logicalFrames.forEach((logframe, index) => {
		logframe.id = '00000000-0000-0000-0000-' + index.toString().padStart(12, '0');

		// Add start and end date
		logframe.start = logframe.end = null;

		// Add activities to logical frameworks
		logframe.purposes.forEach(purpose => {
			purpose.outputs.forEach(output => {
				output.activities = [];
			});
		});
	});

	project.forms.forEach(form => {
		form.elements.forEach(element => {
			// Do not allow partition to have aggregation == 'none' anymore
			element.partitions.forEach(partition => {
				if (partition.aggregation === 'none')
					partition.aggregation = 'sum';
			});

			// Remove variable.order
			element.partitions = rotatePartitions(element.partitions, element.order);
			delete element.order;
		});
	});

	project.users.forEach(function(user) {
		if (user.id)
			user.id = 'user:' + user.id.substring(4);

		if (user.role === 'input' && !user.dataSources)
			user.dataSources = project.forms.map(f => f.id);
	});

	project.themes = project.themes.map(id => 'theme:' + id);

	// indicators
	let newcc = {};
	for (let key in project.crossCutting)
		newcc['indicator:' + key] = project.crossCutting[key];
	project.crossCutting = newcc;
};

const migrateProjects = async () => {
	// Update projects, and create revisions.
	const dbResults = await database.callView('by_type', {key: 'project'});
	const documents = [];

	for (let i = 0; i < dbResults.rows.length; ++i) {
		console.log('project', i, '/', dbResults.rows.length);

		const projectId = dbResults.rows[i].id;
		const dbResult = await database.get(projectId, {revs_info: true, conflicts: true});

		if (dbResult._conflicts)
			dbResult._conflicts.forEach(rev => documents.push({_id: projectId, _rev: rev, _deleted: true}));

		// Get all old revision ids of the project
		const revisionIds = dbResult._revs_info
			.filter(revInfo => revInfo.status === 'available')
			.map(revInfo => revInfo.rev);

		// Delete the document.
		documents.push({_id: projectId, _rev: revisionIds[0], _deleted: true});

		// Fetch each couchdb revision, and create monitool revs.
		for (let j = 0; j < revisionIds.length; ++j) {
			const project = await database.get(projectId, {rev: revisionIds[j]});

			updateProject(project);

			// Create a project with the last version
			if (j === 0) {
				project._id = 'project:' + project._id;
				delete project._rev;
			}
			// Create revisions with all previous ones.
			else {
				const time = revisionIds[j].split('-')[0].padStart(16, '0')
				project._id = 'rev:project:' + project._id + ':' + time;
				delete project._rev;
				project.type = 'rev:project';
			}

			documents.push(project);
		}

		// Insert 20 by 20 to avoid killing the database
		while (documents.length)
			await database.callBulk({docs: documents.splice(0, 20)});
	}
};

const migrateIndicators = async () => {
	const dbResults = await database.callView('by_type', {key: 'indicator', include_docs: true});
	const documents = [];

	for (let i = 0; i < dbResults.rows.length; ++i) {
		const indicator = dbResults.rows[i].doc;

		documents.push({_id: indicator._id, _rev: indicator._rev, _deleted: true});

		indicator._id = 'indicator:' + indicator._id;
		delete indicator._rev;
		indicator.themes = indicator.themes.map(t => 'theme:' + t);
		documents.push(indicator);
	}

	await database.callBulk({docs: documents});
}

const migrateThemes = async () => {
	const dbResults = await database.callView('by_type', {key: 'theme', include_docs: true});
	const documents = [];

	for (let i = 0; i < dbResults.rows.length; ++i) {
		const theme = dbResults.rows[i].doc;

		documents.push({_id: theme._id, _rev: theme._rev, _deleted: true});

		theme._id = 'theme:' + theme._id;
		delete theme._rev;
		documents.push(theme);
	}

	await database.callBulk({docs: documents});
}

const migrateUsers = async () => {
	const dbResults = await database.callView('by_type', {key: 'user', include_docs: true});
	const documents = [];

	for (let i = 0; i < dbResults.rows.length; ++i) {
		const user = dbResults.rows[i].doc;

		documents.push({_id: user._id, _rev: user._rev, _deleted: true});

		user._id = 'user:' + user._id.substring(4);
		delete user._rev;
		documents.push(user);
	}

	await database.callBulk({docs: documents});
}


const migrateDesignDoc = async () => {
	// Update design document.
	const ddoc = await database.get('_design/monitool');

	delete ddoc.views.by_type;
	delete ddoc.views.inputs_by_project_date;
	delete ddoc.views.inputs_by_project_entity_date;
	delete ddoc.views.inputs_by_project_form_date;
	delete ddoc.views.themes_usage;

	ddoc.views.inputs_with_progress = {
		map: function(doc) {
			if (doc.type === 'input') {
				var progress = 0;
				var count = 0;
				for (var key in doc.values) {
					count++;

					for (var i = 0; i < doc.values[key].length; ++i)
						if (doc.values[key][i] !== 0) {
							progress++;
							break;
						}
				}


				emit(doc._id, progress / count);
			}
		}.toString()
	}


	ddoc.views.projects_short = {
		map: function(doc) {
			if (doc.type === 'project') {
				emit(doc._id, {
					_id: doc._id,
					country: doc.country,
					name: doc.name,
					start: doc.start, end: doc.end,
					users: doc.users.map(function(user) {
						return {type: user.type, id: user.id, username: user.username, role: user.role};
					}),
					themes: doc.themes,
					visibility: doc.visibility
				});
			}
		}.toString()
	};

	ddoc.views.projects_public = {
		map: function(doc) {
			if (doc.type === 'project' && doc.visibility === 'public')
				emit();

		}.toString()
	};

	ddoc.views.projects_private = {
		map: function(doc) {
			if (doc.type === 'project' && doc.visibility === 'private')
				doc.users.forEach(function(user) {
					if (user.id)
						emit(user.id);
				});
		}.toString()
	};

	await database.insert(ddoc);
};

/**
 * Big migration for 2.7
 */
export default async function() {
	// The order matters, do not change it.
	await migrateInputs();
	await migrateProjects();
	await migrateIndicators();
	await migrateThemes();
	await migrateUsers();
	await migrateDesignDoc();
};
