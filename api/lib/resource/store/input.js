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

import Store from './store';
import Input from '../model/input';
import Project from '../model/project';

export default class InputStore extends Store {

	get modelString() {
		return 'input';
	}

	get modelClass() {
		return Input;
	}

	/**
	 * Retrieve all input ids that are linked to a particular data source.
	 * Usage
	 *		- Populate datasource planning (/projects/xxx/input).
	 *		- Display warning message when data source is deleted.
	 */
	async listIdsByDataSource(projectId, formId, update=false) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			throw new Error('missing_parameter');

		const result = await this._db.callView(
			'inputs_by_project_form_date',
			{startkey: [projectId, formId], endkey: [projectId, formId, {}]}
		);

		let inputIds = result.rows.map(item => item.id);
		if (update) {
			const project = await Project.storeInstance.get(projectId);
			const dataSource = project.getDataSourceById(formId);

			// Remove inputs that are no longer relevant
			if (dataSource)
				inputIds = inputIds.filter(id => project.getEntityById(id.substr(51, 36)));
			else
				inputIds = [];
		}

		return inputIds;
	}

	async list(update=false) {
		let inputs = await super.list();

		if (update) {
			const projects = await Project.storeInstance.list();

			// Remove inputs that are no longer relevant
			inputs = inputs.filter(input => {
				const project = projects.find(p => p._id === input.project);
				return project.getDataSourceById(input.form) && project.getEntityById(input.entity);
			});

			// Update structure
			inputs.forEach(input => {
				const project = projects.find(p => p._id === input.project);
				const dataSource = project.getDataSourceById(input.form);

				input.update(dataSource.structure)
			});
		}

		return inputs;
	}

	/**
	 * Retrieve all inputs of a given project
	 * Used to generate cubes (for project reporting), or fetch partner inputs.
	 */
	async listByProject(projectId, update=false) {
		if (typeof projectId !== 'string')
			throw new Error('missing_parameter');

		const result = await this._db.callList({
			include_docs: true,
			startkey: 'input:' + projectId + ':!',
			endkey: 'input:' + projectId + ':~'
		});

		let inputs = result.rows.map(row => new Input(row.doc));
		if (update) {
			const project = await Project.storeInstance.get(projectId);

			// Remove inputs that are no longer relevant
			inputs = inputs.filter(input => {
				return project.getDataSourceById(input.form) && project.getEntityById(input.entity);
			});

			// Update structure
			inputs.forEach(input => {
				const dataSource = project.getDataSourceById(input.form);
				input.update(dataSource.structure)
			});
		}

		return inputs;
	}

	/**
	 * Retrieve all inputs of a given data source
	 * Used to generate cubes (for indicator reporting)
	 */
	async listByDataSource(projectId, formId, update=false) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			throw new Error('missing_parameter');

		const result = await this._db.callView(
			'inputs_by_project_form_date',
			{include_docs: true, startkey: [projectId, formId], endkey: [projectId, formId, {}]}
		);

		let inputs = result.rows.map(row => new Input(row.doc));

		if (update) {
			const project = await Project.storeInstance.get(projectId);
			const dataSource = project.getDataSourceById(formId);

			inputs = inputs.filter(input => dataSource && project.getEntityById(input.entity));
			inputs.forEach(input => input.update(dataSource.structure));
		}

		return inputs;
	}

	/**
	 * Retrieve a given input, and the previous one for the same form and entity,
	 * This is used to populate the input page in client.
	 */
	async getLasts(projectId, formId, entityId, period, update=false) {
		if (typeof projectId !== 'string' || typeof formId !== 'string' || typeof entityId !== 'string' || typeof period !== 'string')
			throw new Error('missing_parameter');

		var id       = ['input', projectId, entityId, formId, period].join(':'),
			startKey = id,
			endKey   = ['input', projectId, entityId, formId].join(':'),
			options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true},
			Input    = this.modelClass;

		const result = await this._db.callList(options);

		let inputs;
		if (result.rows.length === 0)
			inputs = [];

		else if (result.rows.length === 1)
			inputs = [new Input(result.rows[0].doc)];

		else if (result.rows.length === 2) {
			var first = new Input(result.rows[0].doc);
			if (first.period === period)
				inputs = [first, new Input(result.rows[1].doc)];
			else
				inputs = [first];
		}
		else
			throw new Error('couchdb did not respect limit=2');

		if (update) {
			const project = await Project.storeInstance.get(projectId);
			const dataSource = project.getDataSourceById(formId);

			inputs.forEach(input => input.update(dataSource.structure));
		}

		return inputs;
	}
}

