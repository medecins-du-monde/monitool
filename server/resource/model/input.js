"use strict";

var validator  = require('is-my-json-valid'),
	TimeSlot   = require('../../olap/time-slot'),
	InputStore = require('../store/input'),
	Model      = require('./model'),
	schema     = require('../schema/input.json');


var validate = validator(schema),
	storeInstance = new InputStore();


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

		// Check that timeslot is valid
		try { new TimeSlot(this.period); }
		catch (e) { throw new Error('invalid_period'); }
	}

	/**
	 * Compute the new value of an input variable according to the changes that were made
	 * in the partitions of a variable.
	 */
	_computeUpdatedValuesKey(oldVariable, newVariable) {
		// Result will be an array of size numValues
		var oldValues = this.values[newVariable.id],
			newValues = new Array(newVariable.numValues);

		// If the variable did not exist before, fill with zeros.
		if (!oldVariable) {
			for (var fieldIndex = 0; fieldIndex < newValues.length; ++fieldIndex)
				newValues[fieldIndex] = 0;
		}
		// If the variable changed, recompute.
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

					// FIXME this assumes that we sum data which is not always the case.
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

	/**
	 * When a project changes, update the content of this input's values.
	 */
	update(oldProject, newProject) {
		var newDataSource = newProject.getDataSourceById(this.form);

		// The data source was deleted, so we can delete the input as well.
		if (!newDataSource) {
			this._deleted = true;
			return true;
		}

		// No update is needed: the signature of the datasource did not change.
		var oldDataSource = oldProject.getDataSourceById(this.form);
		if (oldDataSource.signature === newDataSource.signature)
			return false;

		// We need to update the values.
		var newInputValues = {};

		newDataSource.elements.forEach(function(newVariable) {
			var oldVariable = oldDataSource.getVariableById(newVariable.id);

			// Update only values that changed.
			if (!oldVariable || oldVariable.signature !== newVariable.signature)
				newInputValues[newVariable.id] = this._computeUpdatedValuesKey(oldVariable, newVariable);
		}, this);
		
		this.values = newInputValues;

		return true;
	}

	/**
	 * Validate that input does not make references to project, datasource, variable, partitions that don't exist
	 * We don't check for valid periodicity and entity because the client supports having inputs that are "out of calendar".
	 * This allows not loosing data when we update the periodicity of a data source but will be removed.
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

