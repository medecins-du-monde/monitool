"use strict";

var Variable = require('./variable');


class DataSource {

	constructor(data) {
		Object.assign(this, data);
		this.elements = this.elements.map(el => new Variable(el));
	}

	/**
	 * Signature that changes when the storage of this data source changes
	 */
	get signature() {
		return JSON.stringify(
			form.elements.map(function(element) {
				// the order of partitions matters => to not sort!
				return [element.id, element.signature];
				// the order of elements does not matters => sort by id to avoid rewriting all inputs for nothing.
			}).sort(function(el1, el2) { return el1[0].localeCompare(el2[0]); })
		);
	}

	getVariableById(id) {
		var variables = this.elements.filter(el => el.id === id);
		return variables.length ? variables[0] : null;
	}

}


module.exports = DataSource;
