"use strict";

var validator = require('is-my-json-valid'),
	TimeSlot  = require('../../olap/time-slot'),
	Model     = require('../model'),
	Store     = require('../store'),
	schema    = require('./input.json');

var validate = validator(schema);


class InputStore extends Store {

	get modelClass() { return Input; }
	get modelString() { return 'input'; }

	/**
	 * Retrieve all input ids that are linked to a particular data source.
	 * Used
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
			opt = {include_docs: true, startkey: [projectId], endkey: [projectId, {}]};

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
			opt = {include_docs: true, startkey: [projectId, formId], endkey: [projectId, formId, {}]};

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
			options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true};

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


var storeInstance = new InputStore();

class Input extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Hydrate a Input object from a POJO.
	 * Raises exception if data is not formatted properly.
	 */
	constructor(data) {
		super(data, validate);

		// check that id decomposition matches what's in the rest of document.
		var parts = this._id.split(':');
		if (parts.length !== 4 || parts[0] !== this.project || parts[1] !== this.entity || parts[2] !== this.form || parts[3] !== this.period)
			throw new Error('invalid_id');

		// check that timeslot is valid
		try { new TimeSlot(this.period); }
		catch (e) { throw new Error('invalid_period'); }
	}

	_computeUpdatedValuesKey(oldVariable, newVariable) {
		// Result will be an array of size numValues
		var oldValues = this.values[newVariable.id],
			newValues = new Array(newVariable.numValues);

		// If the form element did not exist before, fill with zeros.
		if (!oldVariable) {
			for (var fieldIndex = 0; fieldIndex < newValues.length; ++fieldIndex)
				newValues[fieldIndex] = 0;
		}
		else {
			var decodedValues = {};

			// FIXME This is O(scary)
			// Compute all possibles partitions sums for this field.
			oldValues.forEach(function(field, fieldIndex) {
				// Which partition does this field correspond to?
				var peIds = oldVariable.computePartitionElementIds(fieldIndex).sort();

				var numSubsets = Math.pow(2, peIds.length);
				for (var subsetIndex = 0; subsetIndex < numSubsets; ++subsetIndex) {
					var subsetKey = peIds.filter((id, index) => subsetIndex & (1 << index)).join('.');

					// FIXME this assumes that we sum data.
					if (decodedValues[subsetKey] == undefined)
						decodedValues[subsetKey] = 0;
					decodedValues[subsetKey] += field || 0;
				}
			});

			// Fill it using same magic as before.
			for (var fieldIndex = 0; fieldIndex < newValues.length; ++fieldIndex) {
				// now that we have our index and value, we have to guess from which partition elements
				// they come from.
				var key = newVariable.computePartitionElementIds(fieldIndex).sort().join('.');
				newValues[fieldIndex] = decodedValues[key] || 0;
			}
		}

		return newValues;
	}

	_computeUpdatedValuesHash(oldDataSource, newDataSource) {
		var newInputValues = {};

		newDataSource.elements.forEach(function(newVariable) {
			var oldVariable = oldDataSource.getVariableById(newVariable.id);
			newInputValues[newVariable.id] = this._computeUpdatedValuesKey(oldVariable, newVariable);
		}, this);

		return newInputValues;
	}

	update(oldProject, newProject) {
		var newDataSource = newProject.getDataSourceById(this.form);

		// The form was deleted, so we can delete the input as well.
		if (!newDataSource) {
			this._deleted = true;
			return true;
		}

		// No update is needed: the signature of the datasource did not change.
		var oldDataSource = oldProject.getDataSourceById(this.form);
		if (oldDataSource.signature === newDataSource.signature)
			return false;

		this.values = this._computeUpdatedValuesHash(oldDataSource, newDataSource);
		return true;
	}

	/**
	 * Validate that input does not make references to things that don't exist
	 */
	validateForeignKeys() {
		var Project = require('./project'); // Circular import...

		return Project.storeInstance.get(this.project).then(function(project) {
			var errors = [];

			// entity must exist in the project
			if (this.entity !== 'none' && project.entities.filter(e => this.entity === e.id).length === 0)
				errors.push('unknown_entity');

			var dataSource = project.getDataSourceById(this.form);
			if (dataSource) {
				// Check that all variables exist and have the proper length
				for (var i = 0; i < dataSource.elements.length; ++i) {
					var variable = dataSource.elements[i];

					if (!this.values[variable.id])
						errors.push('missing_variable_' + variable.id);
					else if (this.values[variable.id].length !== variable.numValues)
						errors.push('variable_length_mismatch_' + variable.id);
				}

				// Check that there are no extra variables.
				for (var variableId in this.values) {
					var variable = dataSource.getVariableById(variableId);
					if (!variable)
						errors.push('extra_variable_' + variable.id);
				}

				// FIXME
				// We don't check for valid periodicity and entity
				// before the client supports having inputs that are "out of calendar".
				// This allows not loosing data when we update the periodicity of a data source
				// but will be removed.
			}
			else
				// Data source must exist
				errors.push('unknown_datasource');

			if (errors.length) {
				var exc = new Error('invalid_reference');
				exc.model = this;
				exc.detail = errors;
				throw exc;
			}
		}.bind(this));
	}
}


module.exports = Input;

