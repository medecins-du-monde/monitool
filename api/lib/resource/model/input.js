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
import TimeSlot from 'timeslot-dag';

import Cube from '../../olap/cube';
import Dimension from '../../olap/dimension';
import InputStore from '../store/input';
import DbModel from './db-model';
import schema from '../schema/input.json';

import Project from './project';

var validate = validator(schema),
	storeInstance = new InputStore();


export default class Input extends DbModel {

	static get storeInstance() {
		return storeInstance;
	}

	/**
	 * Hydrate a Input object from a POJO.
	 * Raises exception if data is not formatted properly.
	 */
	constructor(data) {
		super(data, validate);

		// check that id decomposition matches what's in the rest of document.
		let isValid = this._id === ['input', this.project, this.form, this.entity, this.period].join(':');
		if (!isValid)
			throw new Error('invalid_id');

		// Check that timeslot is valid
		try { new TimeSlot(this.period); }
		catch (e) { throw new Error('invalid_period'); }
	}

	/**
	 * When a project changes, update the content of this input's values.
	 */
	update(newDsStructure) {
		var newValues = {};

		for (let variableId in newDsStructure) {
			const oldStructure = this.structure[variableId];
			const newStructure = newDsStructure[variableId];

			if (!oldStructure)
				newValues[variableId] = this._createBlankRecord(newStructure);

			else if (JSON.stringify(oldStructure) !== JSON.stringify(newStructure))
				newValues[variableId] = this._migrateRecord(oldStructure, newStructure, this.values[variableId]);

			else
				newValues[variableId] = this.values[variableId];
		}

		this.values = newValues;
	}

	_createBlankRecord(newStructure) {
		const newLength = newStructure.reduce((m, p) => m * p.items.length, 1);
		const newValues = new Array(newLength);
		newValues.fill(0);

		return newValues;
	}

	/**
	 * Compute the new value of an input variable according to the changes that were made
	 * in the partitions of a variable.
	 */
	_migrateRecord(oldStructure, newStructure, oldValues) {
		const newValuesLength = newStructure.reduce((m, p) => m * p.items.length, 1);
		const newValues = new Array(newValuesLength);

		const newStructureLength = newStructure.length;

		//////////////
		// Step 1: Start by adding zero until we have all elements of newStructure in the old one.
		//////////////

		// Search for new partitions.
		for (let i = 0; i < newStructureLength; ++i) {
			let newPartition = newStructure[i];

			// This partition already existed in the past, we can skip it.
			if (!oldStructure.find(p => p.id === newPartition.id)) {
				// Unshift the partition
				oldStructure.unshift(newPartition);

				// Put zeros in oldValues to have to good length.
				const oldLength = oldValues.length;
				oldValues.length = oldLength * newPartition.items.length;
				oldValues.fill(0, oldLength);
			}
		}

		//////////////
		// Step 2: We'll now fill a blank Array from the data in oldValues using a cube.
		//////////////

		// Create an olap cube from the old values.
		let dimensions = oldStructure.map(p => new Dimension(p.id, p.items, p.aggregation)),
			cube = new Cube(null, dimensions, [], oldValues);

		const textFilter = {};
		const intFilter = new Array(newStructureLength);
		for (let i = 0; i < newStructureLength; ++i) {
			intFilter[i] = 0;
			textFilter[newStructure[i].id] = [newStructure[i].items[0]];
		}

		let fieldIndex = 0;
		while (fieldIndex < newValues.length) {
			// Try to retrieve the value from the cube.
			newValues[fieldIndex] = cube.query([], textFilter) || 0;

			// Increment intFilter, textFilter and fieldIndex.
			for (let i = newStructureLength - 1; i >= 0; --i) {
				++intFilter[i];

				if (intFilter[i] == newStructure[i].items.length) {
					intFilter[i] = 0;
					textFilter[newStructure[i].id][0] = newStructure[i].items[0];
				}
				else {
					textFilter[newStructure[i].id][0] = newStructure[i].items[intFilter[i]];
					break;
				}
			}

			++fieldIndex;
		}

		return newValues;
	}

	/**
	 * Validate that input does not make references to project, datasource, variable, partitions that don't exist
	 * We don't check for valid periodicity and entity because the client supports having inputs that are "out of calendar".
	 * This allows not loosing data when we update the periodicity of a data source but will be removed.
	 */
	async validateForeignKeys(project=null) {
		if (!project)
			project = await Project.storeInstance.get(this.project);

		var errors = [];

		// entity must exist in the project
		if (!project.entities.find(e => this.entity === e.id))
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
	}

	toAPI() {
		let result = super.toJSON();
		delete result.structure;
		return result;
	}

	async save(skipChecks) {
		if (skipChecks)
			return super.save(true);

		const project = await Project.storeInstance.get(this.project);
		await this.validateForeignKeys(project);
		this.structure = project.getDataSourceById(this.form).structure;
		this.updatedAt = new Date().toISOString();

		return super.save(true);
	}
}

