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
	async listIdsByDataSource(projectId, formId) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			throw new Error('missing_parameter');

		var view = 'inputs_by_project_form_date',
			opt = {startkey: [projectId, formId], endkey: [projectId, formId, {}]};

		const result = await this._db.callView(view, opt);
		return result.rows.map(item => item.id);
	}

	/**
	 * Retrieve all input ids that are linked to a particular entity.
	 * Used to display warning message when entity is deleted.
	 */
	async listIdsByEntity(projectId, entityId) {
		if (typeof projectId !== 'string' || typeof entityId !== 'string')
			throw new Error('missing_parameter');

		var view = 'inputs_by_project_entity_date',
			opt = {startkey: [projectId, entityId], endkey: [projectId, entityId, {}]};

		const result = await this._db.callView(view, opt);
		return result.rows.map(item => item.id);
	}

	/**
	 * Retrieve all inputs of a given project
	 * Used to generate cubes (for project reporting), or fetch partner inputs.
	 */
	async listByProject(projectId) {
		if (typeof projectId !== 'string')
			throw new Error('missing_parameter');

		var opt = {
			include_docs: true,
			startkey: 'input:' + projectId + ':!',
			endkey: 'input:' + projectId + ':~'};

		const result = await this._db.callList(opt);
		return result.rows.map(row => new Input(row.doc));
	}

	/**
	 * Retrieve all inputs of a given data source
	 * Used to generate cubes (for indicator reporting), or update inputs when project is mutated.
	 */
	async listByDataSource(projectId, formId) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			throw new Error('missing_parameter');

		var view = 'inputs_by_project_form_date',
			opt = {include_docs: true, startkey: [projectId, formId], endkey: [projectId, formId, {}]};

		const result = await this._db.callView(view, opt);
		return result.rows.map(row => new Input(row.doc));
	}

	/**
	 * Retrieve all input that are linked to a particular entity.
	 * Used to delete inputs when matching entity is deleted.
	 */
	async listByEntity(projectId, entityId) {
		if (typeof projectId !== 'string' || typeof entityId !== 'string')
			throw new Error('missing_parameter');

		var view = 'inputs_by_project_entity_date',
			opt = {include_docs: true, startkey: [projectId, entityId], endkey: [projectId, entityId, {}]},
			Input = this.modelClass;

		const result = await this._db.callView(view, opt);
		return result.rows.map(row => new Input(row.doc));
	}

	/**
	 * Retrieve a given input, and the previous one for the same form and entity,
	 * This is used to populate the input page in client.
	 */
	async getLasts(projectId, formId, entityId, period) {
		if (typeof projectId !== 'string' || typeof formId !== 'string' || typeof entityId !== 'string' || typeof period !== 'string')
			throw new Error('missing_parameter');

		var id       = ['input', projectId, entityId, formId, period].join(':'),
			startKey = id,
			endKey   = ['input', projectId, entityId, formId].join(':'),
			options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true},
			Input    = this.modelClass;

		const result = await this._db.callList(options);

		if (result.rows.length === 0)
			return [];

		else if (result.rows.length === 1)
			return [new Input(result.rows[0].doc)];

		else if (result.rows.length === 2) {
			var first = new Input(result.rows[0].doc);
			if (first.period === period)
				return [first, new Input(result.rows[1].doc)];
			else
				return [first];
		}
		else
			throw new Error('couchdb did not respect limit=2');
	}
}

