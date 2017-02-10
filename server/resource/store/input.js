"use strict";

var Store = require('./store');

class InputStore extends Store {

	get modelString() { return 'input'; }

	/**
	 * Retrieve all input ids that are linked to a particular data source.
	 * Usage
	 *		- Populate datasource planning (/projects/xxx/input).
	 *		- Display warning message when data source is deleted.
	 */
	listIdsByDataSource(projectId, formId) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var view = 'inputs_by_project_form_date',
			opt = {startkey: [projectId, formId], endkey: [projectId, formId, {}]};

		return this._callView(view, opt).then(function(result) {
			return result.rows.map(item => item.id);
		});
	}

	/**
	 * Retrieve all input ids that are linked to a particular entity.
	 * Used to display warning message when entity is deleted.
	 */
	listIdsByEntity(projectId, entityId) {
		if (typeof projectId !== 'string' || typeof entityId !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var view = 'inputs_by_project_entity_date',
			opt = {startkey: [projectId, entityId], endkey: [projectId, entityId, {}]};

		return this._callView(view, opt).then(function(result) {
			return result.rows.map(item => item.id);
		});
	}

	/**
	 * Retrieve all inputs of a given project
	 * Used to generate cubes (for project reporting), or fetch partner inputs.
	 */
	listByProject(projectId) {
		if (typeof projectId !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var view = 'inputs_by_project_form_date',
			opt = {include_docs: true, startkey: [projectId], endkey: [projectId, {}]},
			Input = this.modelClass;

		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Input(row.doc));
		});
	}

	/**
	 * Retrieve all inputs of a given data source
	 * Used to generate cubes (for indicator reporting), or update inputs when project is mutated.
	 */
	listByDataSource(projectId, formId) {
		if (typeof projectId !== 'string' || typeof formId !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var view = 'inputs_by_project_form_date',
			opt = {include_docs: true, startkey: [projectId, formId], endkey: [projectId, formId, {}]},
			Input = this.modelClass;

		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Input(row.doc));
		});
	}

	/**
	 * Retrieve a given input, and the previous one for the same form and entity,
	 * This is used to populate the input page in client.
	 */
	getLasts(projectId, formId, entityId, period) {
		if (typeof projectId !== 'string' || typeof formId !== 'string' || typeof entityId !== 'string' || typeof period !== 'string')
			return Promise.reject(new Error('missing_parameter'));

		var id       = [projectId, entityId, formId, period].join(':'),
			startKey = id,
			endKey   = [projectId, entityId, formId].join(':'),
			options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true},
			Input    = this.modelClass;

		return this._callList(options).then(function(result) {
			// retrieve current and previous from view result.
			var current = null, previous = null;

			if (result.rows.length === 1) {
				if (result.rows[0].id !== id) // we only got an old input
					previous = new Input(result.rows[0].doc);
				else // we only got the current input
					current = new Input(result.rows[0].doc);
			}
			else if (result.rows.length === 2) {
				if (result.rows[0].id !== id) // we got two old inputs
					previous = new Input(result.rows[0].doc);
				else // we got the current and previous inputs
					current = new Input(result.rows[0].doc);
					previous = new Input(result.rows[1].doc);
			}

			return [current, previous].filter(i => !!i);
		});
	}
}

module.exports = InputStore;