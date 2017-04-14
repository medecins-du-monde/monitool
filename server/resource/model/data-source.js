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

var Variable  = require('./variable'),
	validator = require('is-my-json-valid'),
	Model     = require('./model'),
	schema    = require('../schema/data-source.json');

var validate = validator(schema);

class DataSource extends Model {

	constructor(data, project) {
		super(data, validate);

		let entityIds = project.entities.map(e => e.id);

		data.entities.forEach(function(entityId) {
			if (entityIds.indexOf(entityId) === -1)
				throw new Error('invalid_data');
		});

		this._project = project;
		this.elements = this.elements.map(el => new Variable(el));
	}

	/**
	 * Signature of this variable
	 * The signature is a string with no special meaning that changes when the way to store this variable in
	 * inputs will change.
	 * It is used to know when it is needed to update inputs.
	 */
	get signature() {
		return JSON.stringify(
			this.elements.map(function(element) {
				// the order of partitions matters => to not sort!
				return [element.id, element.signature];
				// the order of elements does not matters => sort by id to avoid rewriting all inputs for nothing.
			}).sort(function(el1, el2) { return el1[0].localeCompare(el2[0]); })
		);
	}

	/**
	 * Retrieve a variable by id
	 */
	getVariableById(id) {
		return this.elements.find(el => el.id === id);
	}

	getPdfDocDefinition(pageOrientation) {
		var doc = {};
		doc.pageSize = "A4";
		doc.pageOrientation = pageOrientation;

		doc.content = [
			{text: this.name, style: 'header'},
			{text: "General information", style: "header2"},
			{style: "variableName", text: "Collection site"},
			{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
			{style: "variableName", text: "Covered period"},
			{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
			{style: "variableName", text: "Collected by"},
			{table: {headerRows: 0, widths: ['*'], body: [[' ']]}},
			{text: "Data", style: "header2"}
		].concat(this.elements.map(el => el.getPdfDocDefinition()));

		return doc;
	}

}

module.exports = DataSource;
