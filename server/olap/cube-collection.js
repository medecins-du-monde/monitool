"use strict";

var Cube = require('./cube');

/**
 * A cube collection is a container that contains all cubes from the variables of a given project
 * 
 * If there is a need to implement queries across multiple cubes, it can be implemented here.
 */
class CubeCollection {

	static fromProject(project, allInputs) {
		var cubes = [];

		project.forms.forEach(function(form) {
			var inputs = allInputs.filter(function(input) { return input.form === form.id; })

			form.elements.forEach(function(element) {
				cubes.push(Cube.fromElement(project, form, element, inputs));
			});
		});

		return new CubeCollection(cubes);
	}

	constructor(cubes) {
		this._cubes = cubes;
	}

	serialize() {
		return this._cubes.map(function(cube) { return cube.serialize(); });
	}

}

module.exports = CubeCollection;
