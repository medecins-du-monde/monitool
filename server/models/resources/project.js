"use strict";

var validator    = require('is-my-json-valid'),
	passwordHash = require('password-hash'),
	Store        = require('../store'),
	Model        = require('../model'),
	DataSource   = require('./data-source'),
	schema       = require('./project.json');

var validate = validator(schema);


class ProjectStore extends Store {

	get modelClass() { return Project; }
	get modelString() { return 'project'; }

	/**
	 * Retrieve list of all projects summaries
	 * Most fields are missing from this query (hence, it returns POJOs instead of Project's instances).
	 *
	 * Used in the client to display list of projects.
	 */
	listShort(userId) {
		if (typeof userId !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var view = 'projects_short';

		return this._callView(view, {}).then(function(result) {
			var projects = result.rows.map(row => row.value);

			projects.forEach(function(p) {
				p.users = p.users.filter(u => u.id === userId)
			});

			return projects;
		});
	}

	/**
	 * Retrieve all projects that collect a given indicator.
	 * The projects are stripped down before sending (the subset is selected to ensure that client,
	 * has enought info to compute the cross-cutting indicator).
	 *
	 * Used in the client to display cross-cutting reporting.
	 */
	listByIndicator(indicatorId, strippedDown) {
		if (typeof indicatorId !== 'string')
			return Promise.reject(new Error("missing_parameter"));

		var view = 'cross_cutting', opt = {key: indicatorId, include_docs: true};

		return this._callView(view, opt).then(function(result) {
			var projects = result.rows.map(row => row.doc);

			// strip down project
			if (strippedDown) {
				projects.forEach(function(project) {
					var cc = {}
					cc[indicatorId] = project.crossCutting[indicatorId];
					project.crossCutting = cc;

					var used = {};
					if (project.crossCutting[indicatorId].computation)
						for (var key in project.crossCutting[indicatorId].computation.parameters)
							used[project.crossCutting[indicatorId].computation.parameters[key].elementId] = true;

					project.logicalFrames = project.users = project.themes = [];
					project.forms.forEach(function(f) { f.elements = f.elements.filter(e => used[e.id]); });
					project.forms = project.forms.filter(f => f.elements.length);
					project.extraIndicators = [];
				});
			}
			
			return projects.map(p => new Project(p));
		});
	}

	listByTheme(themeId) {
		throw new Error("Implement me")
	}
}


var storeInstance = new ProjectStore();

class Project extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from the API/DB.
	 */
	constructor(data) {
		super(data, validate);

		// Check that entity ids exist in groups, ...
		var entityIds = data.entities.map(e => e.id);
		data.groups.forEach(function(group) {
			group.members.forEach(function(entityId) {
				if (entityIds.indexOf(entityId) === -1)
					throw new Error('invalid_data');
			});
		});

		// Create forms
		this.forms = this.forms.map(f => new DataSource(f));

		// Replace passwords by a salted hash
		this.users.forEach(function(user) {
			if (user.type === 'partner' && typeof user.password === 'string' && !user.password.match('^sha1\$[0-9a-z]+$'))
				user.password = passwordHash.generate(user.password);
		});
	}

	getDataSourceById(id) {
		var dataSources = this.forms.filter(ds => ds.id === id);
		return dataSources.length ? dataSources[0] : null;
	}

	getRole(user) {
		if (user.type === 'partner')
			return user.projectId !== this._id ? 'none' : user.role;
		
		else if (user.type === 'user') {
			if (user.role === 'admin')
				return 'owner';
			else {
				var projectUsers = this.users.filter(u => u.id === user._id);
				return projectUsers.length === 0 ? 'readonly' : projectUsers[0].role;
			}
		}
		else
			return 'none';
	}

	copyUnchangedPasswords(oldProject) {
		this.users.forEach(function(user) {
			// retrieve old user.
			var oldUser = oldProject.getUserByUsername(user.username);

			// copy hash
			if (user.password === null && oldUser !== null)
				user.password = oldUser.password;
		});
	}

	computeInputsUpdates(oldProject) {
		var changedFormsId = [];

		// Get all forms that existed before, and changed since last time.
		this.forms.forEach(function(newForm) {
			var oldForm = oldProject.forms.find(f => f.id == newForm.id);

			if (oldForm && oldForm.signature !== newForm.signature)
				changedFormsId.push(newForm.id)
		});

		// Get all forms that were deleted.
		oldProject.forms.forEach(function(oldForm) {
			if (!oldProject.forms.find(f => f.id == oldForm.id))
				changedFormsId.push(oldForm.id);
		});

		var promises = changedFormsId.map(formId => Input.listByDataSource(this._id, changedFormsId));
		
		return Promise.all(promises).then(function(inputs) {
			inputs = inputs.reduce((m, e) => Array.prototype.push.call(m, e), []);
			inputs.forEach(input => input.update(oldProject, this));

			return inputs;
		}.bind(this));
	}

	save() {
		return Project
			.get(this._id)
			.then(function(oldProject) {
				this.copyUnchangedPasswords(oldProject);
				return this.computeInputsUpdates(oldProject);
			})
			.then(function(updates) {
				updates.push(this);
				
			});
	}

	toAPI() {
		var json = Object.assign({}, this);

		json.users = this.users.map(function(user) {
			user = Object.assign({}, user);
			if (user.type === 'partner')
				user.password = null;

			return user;
		});

		return json;
	}

}


module.exports = Project;

// function correctProjectInputs(oldProject, newProject, callback) {
// 	var tasks = [];

// 	// iterate on all new forms, to check if they need updating.
// 	newProject.forms.forEach(function(newForm) {
// 		// Retrieve old form
// 		var oldForm = oldProject.forms.filter(function(f) { return f.id == newForm.id; });
// 		if (oldForm.length)
// 			oldForm = oldForm[0];
// 		else
// 			return;

// 		// compare to old and new
// 		if (extractRelevantInformation(oldForm) !== extractRelevantInformation(newForm)) {
// 			// we need to fetch all inputs and update them.
// 			tasks.push(updateInputs.bind(null, newProject._id, oldForm, newForm));
// 		}
// 	});

// 	if (tasks.length)
// 		async.parallel(tasks, callback)
// 	else
// 		callback();
// }

// function removeUnlinkedInputs(mode, oldProject, newProject, removeFinishedCallback) {
// 	var listName = {entity: 'entities', form: 'forms'}[mode];

// 	var oldForms = oldProject[listName].map(function(f) { return f.id; }),
// 		newForms = newProject[listName].map(function(f) { return f.id; }),
// 		removedForms = oldForms.filter(function(id) { return newForms.indexOf(id) === -1; });

// 	if (!removedForms.length)
// 		removeFinishedCallback();

// 	else
// 		async.map(
// 			removedForms,
// 			function(formId, cb) {
// 				var opt = {include_docs: true, startkey: [newProject._id, formId], endkey: [newProject._id, formId, {}]};

// 				database.view('reporting', 'inputs_by_project_' + mode + '_date', opt, function(error, result) {
// 					cb(null, result.rows.map(function(row) { return {_id: row.id, _rev: row.doc._rev, _deleted: true}; }));
// 				});
// 			},
// 			function(error, inputs) {
// 				inputs = Array.prototype.concat.apply([], inputs);
// 				if (!inputs.length)
// 					removeFinishedCallback()
// 				else
// 					// Assume that the operation goes well
// 					database.bulk({docs: inputs}, {}, removeFinishedCallback);
// 			}
// 		);
// }


// module.exports = {

// 	_getFieldIndex: getFieldIndex,
// 	_getPartitionElementIds: getPartitionElementIds,
// 	_correctFormInputs: correctFormInputs,
// 	_extractRelevantInformation: extractRelevantInformation,
// 	_updateInputs: updateInputs,
// 	_correctProjectInputs: correctProjectInputs,
// 	_removeUnlinkedInputs: removeUnlinkedInputs,

// 	list: function(options, callback) {
// 		if (options.mode === 'list')
			

// 		else if (options.mode === 'crossCutting')
			

// 		else
// 			Abstract.list('project', options, function(error, projects) {
// 				if (projects)
// 					projects.forEach(removePasswords);

// 				callback(error, projects);
// 			});
// 	},

// 	get: function(id, callback) {
// 		Abstract.get.call(this, 'project', id, function(error, project) {
// 			if (project)
// 				removePasswords(project);

// 			callback(error, project);
// 		});
// 	},

// 	delete: function(id, callback) {
// 		var opts = {include_docs: true, startkey: [id], endkey: [id, {}]};

// 		database.view('reporting', 'inputs_by_project_date', opts, function(error, result) {
// 			var inputs = result.rows.map(function(row) {
// 				return { _id: row.id, _rev: row.doc._rev, _deleted: true };
// 			});

// 			database.bulk({docs: inputs}, {}, function() {
// 				Abstract.delete('project', id, callback);
// 			});
// 		});
// 	},

// 	set: function(newProject, callback) {
// 		database.get(newProject._id, function(error, oldProject) {
// 			if (oldProject)
// 				removeUnlinkedInputs('entity', oldProject, newProject, function() {
// 					removeUnlinkedInputs('form', oldProject, newProject, function() {
// 						correctProjectInputs(oldProject, newProject, function() {
// 							hashPasswords(oldProject, newProject);
// 							Abstract.set(newProject, function(error, result) {
// 								removePasswords(newProject);

// 								callback(error, result);
// 							});
// 						});
// 					});
// 				});
			
// 			else {
// 				hashPasswords(null, newProject);
// 				Abstract.set(newProject, function(error, result) {
// 					removePasswords(newProject);

// 					callback(error, result);
// 				});
// 			}
// 		});
// 	},

// 	validate: function(item, callback) {


// 		return callback(errors.length ? errors : null);
// 	}

// };

