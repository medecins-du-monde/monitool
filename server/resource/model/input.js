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

"use strict";

var validator  = require('is-my-json-valid'),
	Cube       = require('../../olap/cube'),
	Variable   = require('./variable'),
	Dimension  = require('../../olap/dimension'),
	TimeSlot   = require('../../olap/time-slot'),
	InputStore = require('../store/input'),
	DbModel    = require('./db-model'),
	schema     = require('../schema/input.json');


var validate = validator(schema),
	storeInstance = new InputStore();


class Input extends DbModel {

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
		let oldValues = this.values[newVariable.id],
			newValues = new Array(newVariable.numValues);

		// If the variable did not exist before, fill with zeros.
		if (!oldVariable) {
			for (let fieldIndex = 0; fieldIndex < newValues.length; ++fieldIndex)
				newValues[fieldIndex] = 0;
		}
		// If the variable changed, recompute.
		else {
			// Search for new partitions.
			var newPartitions = newVariable.partitions.filter(function(nvp) {
				return !oldVariable.partitions.find(ovp => ovp.id === nvp.id);
			});

			// partitions were created, let's handle this first.
			if (newPartitions.length) {
				// we create an intermediary variable with the new partitions.
				oldVariable = new Variable(JSON.parse(JSON.stringify(oldVariable)));
				oldValues = oldValues.slice();

				newPartitions.forEach(function(newPartition) {
					oldVariable.partitions.unshift(newPartition);
					
					let newLength = oldValues.length * newPartition.elements.length;
					while (oldValues.length < newLength)
						oldValues.push(0);
				});
			}
			else {
				// nothing in this case.
				// - Partition removal, or partition element removal will be handled
				//   natively by the cube.
				// - partition element add will be detected by catching exception when
				//   querying the cube.
			}

			// Create an olap cube from the old values.
			let dimensions = oldVariable.partitions.map(p => Dimension.createPartition(p)),
				cube = new Cube(oldVariable.id, dimensions, [], oldValues);

			// Fill the new values from the cube.
			for (let fieldIndex = 0; fieldIndex < newValues.length; ++fieldIndex) {
				// Build a filter targeting this specific value.
				let peIds = newVariable.computePartitionElementIds(fieldIndex),
					filter = {};

				for (let i = 0; i < newVariable.partitions.length; ++i)
					filter[newVariable.partitions[i].id] = [peIds[i]];

				// Try to retrieve the value from the cube.
				try {
					newValues[fieldIndex] = cube.query([], filter);
				}

				// The cube raised an error, this means that we asked for an inexistent
				// partitionElementId in the cube (which is made from former data).
				catch (e) {
					newValues[fieldIndex] = 0;
				}
			}
		}

		return newValues;
	}

	/**
	 * When a project changes, update the content of this input's values.
	 */
	update(oldProject, newProject) {
		let newDataSource = newProject.getDataSourceById(this.form),
			newEntity     = newProject.getEntityById(this.entity);

		// The data source or entity was deleted, we can delete the input as well.
		if (!newDataSource || !newEntity) {
			this._deleted = true;
			delete this.type;
			delete this.values;
			delete this.project;
			delete this.entity;
			delete this.form;
			delete this.period;

			return true; // true <=> input was modified
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
			else
				newInputValues[newVariable.id] = this.values[newVariable.id];
		}, this);

		this.values = newInputValues;

		return true; // true <=> input was modified
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
			if (project.entities.filter(e => this.entity === e.id).length === 0)
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

