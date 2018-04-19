/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

import validator from 'is-my-json-valid';
import passwordHash from 'password-hash';
import ProjectStore from '../store/project';
import DbModel from './db-model';
import LogicalFrame from './logical-frame';
import DataSource from './data-source';
import Indicator from './indicator';
import Input from './input';
import Theme from './theme';
import schema from '../schema/project.json';

var validate = validator(schema),
	storeInstance = new ProjectStore();

export default class Project extends DbModel {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from the API/DB.
	 */
	constructor(data) {
		super(data, validate);

		// Check that entity ids exist in groups, ...
		let entityIds = data.entities.map(e => e.id),
			dataSourceIds = data.forms.map(ds => ds.id);

		data.groups.forEach(function(group) {
			group.members.forEach(function(entityId) {
				if (entityIds.indexOf(entityId) === -1)
					throw new Error('invalid_data');
			});
		});

		data.users.forEach(function(user) {
			if (user.entities)
				user.entities.forEach(function(entityId) {
					if (entityIds.indexOf(entityId) === -1)
						throw new Error('invalid_data');
				});

			if (user.dataSources)
				user.dataSources.forEach(function(dataSourceId) {
					if (dataSourceIds.indexOf(dataSourceId) === -1)
						throw new Error('invalid_data');
				});
		});

		// Create forms & logicalFrames
		this.forms = this.forms.map(f => new DataSource(f, this));
		this.logicalFrames = this.logicalFrames.map(lf => new LogicalFrame(lf, this));

		// Replace passwords by a salted hash
		this.users.forEach(function(user) {
			if (user.type === 'partner') {
				if (typeof user.password === 'string' && !user.password.match('^sha1')) {
					user.password = passwordHash.generate(user.password);
				}
				else {
				}
			}
		});
	}

	/**
	 * Destroy a project, and all related inputs.
	 *
	 * @return {Promise}
	 */
	async destroy() {
		let inputs = await Input.storeInstance.listByProject(this._id);

		await this._db.callBulk({
			docs: [
				// Delete project
				{_id: this._id, _rev: this._rev, _deleted: true},

				// Delete associated inputs.
				...inputs.map(i => {
					return {_id: i._id, _rev: i._rev, _deleted: true};
				})
			]
		});

		return {};
	}

	/**
	 * Retrieve a datasource by id.
	 */
	getDataSourceById(id) {
		return this.forms.find(ds => ds.id === id);
	}

	/**
	 * Retrieve an entity by id.
	 */
	getEntityById(id) {
		return this.entities.find(e => e.id === id);
	}

	/**
	 * Retrieve the user object from the project that correspond to a user session (request.user).
	 * User session may be a real user, or a partner.
	 * This method does not throw if the user is not found.
	 */
	getProjectUser(user) {
		if (user.type === 'partner')
			return user.projectId === this._id ? user : null;

		else if (user.type === 'user')
			return this.users.find(u => u.id === user._id);

		else
			throw new Error('invalid_user');
	}

	/**
	 * Get the role of an account from its session.
	 * The role may be one of: "none", "readonly", "input" or "owner".
	 */
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

	/**
	 * Retrieve a partner account from its username.
	 * This is used to update passwords
	 */
	getPartnerByUsername(username) {
		return this.users.find(u => u.username === username);
	}

	/**
	 * Take the previous version of the project, and copies all password hashes
	 * from it (this allows not sending them to the client back and forth).
	 * This is used when saving the project.
	 */
	_copyUnchangedPasswords(oldProject) {
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

	/**
	 * Take the previous version of the project, and compute all updates
	 * to inputs that are needed to deal with the structural changes of the forms.
	 */
	async _computeInputsUpdates(oldProject) {
		var changedFormsIds = [];

		// Get all forms that existed before, and changed since last time.
		this.forms.forEach(function(newForm) {
			var oldForm = oldProject.getDataSourceById(newForm.id);

			if (oldForm && oldForm.signature !== newForm.signature)
				changedFormsIds.push(newForm.id)
		});

		// Get all forms that were deleted.
		oldProject.forms.forEach(function(oldForm) {
			if (!this.getDataSourceById(oldForm.id))
				changedFormsIds.push(oldForm.id);
		}, this);

		// Get all entities that were deleted
		var deletedEntitiesIds = oldProject.entities
			.filter(oe => !this.entities.find(nw => nw.id === oe.id))
			.map(entity => entity.id);

		const result = await Promise.all([
			...changedFormsIds.map(dsId => Input.storeInstance.listByDataSource(this._id, dsId)),
			...deletedEntitiesIds.map(eId => Input.storeInstance.listByEntity(this._id, eId))
		])

		let inputsById = {};

		// there might be duplicates if an input was fetched because of
		// both a datasource and an entity.
		result.forEach(function(inputs) {
			inputs.forEach(function(input) {
				inputsById[input._id] = input;
			});
		});

		let inputs = Object.keys(inputsById).map(id => inputsById[id]);
		inputs.forEach(input => input.update(oldProject, this));
		return inputs;
	}

	/**
	 * Validate that project does not make references to indicators and themes that don't exist.
	 */
	async validateForeignKeys() {
		const [indicators, themes] = await Promise.all([
			Indicator.storeInstance.list(),
			Theme.storeInstance.list()
		]);

		Object.keys(this.crossCutting).forEach(indicatorId => {
			if (!indicators.find(i => i._id === indicatorId))
				throw new Error('invalid_reference');
		});

		this.themes.forEach(themeId => {
			if (!themes.find(t => t._id === themeId))
				throw new Error('invalid_reference');
		});
	}

	/**
	 * Save the project.
	 *
	 * This method makes many checks do deal with the fact that there are no foreign keys nor update method.
	 * 	- validate that all foreign keys exist.
	 *	- copy the passwords that were not changed for partners.
	 *	- update all inputs that need a change (depending on structural changes in data sources).
	 */
	async save(skipChecks) {
		// If we skip checks, because we know what we are doing, just delegate to parent class.
		if (skipChecks)
			return super.save(true);

		// Before doing anything, check that the project is valid.
		await this.validateForeignKeys();

		// Get former project or null if missing.
		let oldProject = null;
		try {
			oldProject = await Project.storeInstance.get(this._id);
		}
		catch (error) {
			// if we can't get former project for some other reason than "missing" we are done.
			if (error.message !== 'missing')
				throw error;
		}

		// Handle partner passwords & input structure
		let documents = [this];

		if (oldProject) {
			// Copy old passwords from the old project
			this._copyUnchangedPasswords(oldProject);

			// If we are updating the project, we need to update related inputs.
			documents = documents.concat(await this._computeInputsUpdates(oldProject));
		}

		// FIXME
		// Bulk operations are not really atomic in a couchdb database.
		// if someone else is playing with the database at the same time, we might leave the database in an inconsistent state.
		// This can be easily fixed http://stackoverflow.com/questions/29491618/transaction-like-update-of-two-documents-using-couchdb
		const bulkResults = await this._db.callBulk({docs: documents});

		// bulk updates don't give us the whole document
		var projectResult = bulkResults.find(res => res.id === this._id);
		if (projectResult.error)
			throw new Error(projectResult.error);

		this._rev = projectResult.rev;
		return this; // return updated document.
	}

	toAPI() {
		var obj = super.toAPI();

		// Replace the password by null before sending the project to the user.
		obj.users = this.users.map(function(user) {
			user = Object.assign({}, user);
			if (user.type === 'partner')
				user.password = null;

			return user;
		});

		return obj;
	}

}
