"use strict";

var validator    = require('is-my-json-valid'),
	passwordHash = require('password-hash'),
	Store        = require('../store'),
	Model        = require('../model'),
	DataSource   = require('./data-source'),
	Indicator    = require('./indicator'),
	Input        = require('./input'),
	Theme        = require('./theme'),
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

	/**
	 * Retrieve all projects that are associated with a given theme
	 * This is used to update the projects when deleting a theme
	 */
	listByTheme(themeId) {
		if (typeof themeId !== 'string')
			return Promise.reject(new Error("missing_parameter"));

		var view = 'project_by_theme', opt = {key: themeId, include_docs: true};
		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Project(row.doc));
		});
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

		// FIXME a lot is missing here.


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

	getProjectUser(user) {
		if (user.type === 'partner')
			return user.projectId === this._id ? user : null;

		else if (user.type === 'user') {
			var projectUsers = this.users.filter(u => u.id === user._id);
			return projectUsers.length !== 0 ? projectUsers[0] : null;
		}
		else
			throw new Error('invalid_user');
	}

	getRole(user) {
		if (user.type === 'partner')
			return user.projectId !== this._id ? 'none' : user.role;
		
		else if (user.type === 'user') {
			if (user.role === 'admin')
				return 'owner';
			else {
				var projectUser = this.getProjectUser(user);
				return projectUser ? projectUser.role : 'readonly';
			}
		}
		else
			throw new Error('invalid_user');
	}

	getPartnerByUsername(username) {
		var matches = this.users.filter(function(u) { return u.username === username });
		return matches.length ? matches[0] : null;
	}

	copyUnchangedPasswords(oldProject) {
		this.users.forEach(function(user) {
			if (user.type === 'partner') {
				// retrieve old user.
				var oldUser = oldProject.getPartnerByUsername(user.username);

				// copy hash or raise error
				if (user.password === null) {
					if (oldUser)
						user.password = oldUser.password;
					else
						throw new Error('invalid_data');
				}
			}
		});
	}

	computeInputsUpdates(oldProject) {
		var changedFormsIds = [];

		// Get all forms that existed before, and changed since last time.
		this.forms.forEach(function(newForm) {
			var oldForm = oldProject.getDataSourceById(newForm.id);

			if (oldForm && oldForm.signature !== newForm.signature)
				changedFormsIds.push(newForm.id)
		});

		// Get all forms that were deleted.
		oldProject.forms.forEach(function(oldForm) {
			if (!oldProject.getDataSourceById(oldForm.id))
				changedFormsIds.push(oldForm.id);
		});

		var promises = changedFormsIds.map(dataSourceId => Input.storeInstance.listByDataSource(this._id, dataSourceId));
		
		return Promise.all(promises).then(function(inputs) {
			inputs = inputs.reduce((m, e) => m.concat(e), []);
			inputs.forEach(input => input.update(oldProject, this));
			return inputs;
		}.bind(this));
	}

	/**
	 * Validate that project does not make references to things that don't exist
	 */
	validateForeignKeys() {
		return Promise.all([Indicator.storeInstance.list(), Theme.storeInstance.list()]).then(function(res) {
			var indicators = res[0], themes = res[1];

			Object.keys(this.crossCutting).forEach(function(indicatorId) {
				if (indicators.filter(i => i._id === indicatorId).length === 0)
					throw new Error('invalid_reference');
			});

			this.themes.forEach(function(themeId) {
				if (themes.filter(t => t._id === themeId).length === 0)
					throw new Error('invalid_reference');
			});
		}.bind(this));
	}

	save(skipChecks) {
		// If we skip checks, because we know what we are doing, just delegate to parent class.
		if (skipChecks)
			return super.save(true);

		return this.validateForeignKeys()

			// Get former project or null if missing.
			.then(function() {
				return Project.storeInstance.get(this._id).catch(function(error) {
					// if we can't get former project for some other reason than "missing" we are done.
					return error.message === 'missing' ? null : Promise.reject(error);
				});
			}.bind(this))

			// Handle partner passwords & input structure
			.then(function(oldProject) {
				// If we are updating, copy old passwords from the old project
				if (oldProject)
					this.copyUnchangedPasswords(oldProject);

				// If we are updating the project, we need to update related inputs.
				return oldProject ? this.computeInputsUpdates(oldProject) : [];
			}.bind(this))

			.then(function(updates) {
				updates.push(this);

				// FIXME
				// Bulk operations are not really atomic in a couchdb database.
				// if someone else is playing with the database at the same time, we might leave the database in an inconsistent state.
				// This can be easily fixed http://stackoverflow.com/questions/29491618/transaction-like-update-of-two-documents-using-couchdb
				return Project.storeInstance._callBulk({docs: updates});
			}.bind(this))

			.then(function(bulkResults) {
				// bulk updates don't give us the whole document
				var projectResult = bulkResults.find(res => res.id === this._id);
				if (projectResult.error)
					throw new Error(projectResult.error);
				
				this._rev = projectResult.rev;
				return this; // return updated document.
			}.bind(this));
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

