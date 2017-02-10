"use strict";

var Variable = require('./variable');


class DataSource {

	constructor(data) {
		Object.assign(this, data);
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

}


module.exports = DataSource;
