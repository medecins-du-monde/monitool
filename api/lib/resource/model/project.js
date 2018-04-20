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
	 *	- copy the passwords that were not changed for partners.
	 * 	- validate that all foreign keys exist.
	 */
	async save(skipChecks, user=null) {
		// If we skip checks, because we know what we are doing, just delegate to parent class.
		if (skipChecks)
			return super.save(true);

		// Copy passwords from old project.
		let oldProject;
		try {
			oldProject = await Project.storeInstance.get(this._id);

			this.users.forEach(newUser => {
				if (newUser.type !== 'partner' || newUser.password !== null)
					return;

				var oldUser = oldProject.users.find(u => u.username === newUser.username);
				newUser.password = oldUser.password;
			});
		}
		catch (error) {
			// if we can't get former project for some other reason than "missing" we are done.
			if (error.message !== 'missing')
				throw error;
		}

		// Save with the relevant checks
		let result = await super.save(false);

		// Save history if all the rest succeded (errors will raise exceptions).
		if (oldProject) {
			let time = (+new Date()).toString().padStart(16, '0')

			delete oldProject._rev;
			oldProject._id = 'rev:' + oldProject._id + ':' + time;
			oldProject.type = 'rev:project';

			if (user)
				oldProject.modifiedBy = user._id || ('partner:' + user.username);

			await this._db.insert(oldProject);
		}

		// the user want the result of the save operation, not the revision.
		return result;
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
