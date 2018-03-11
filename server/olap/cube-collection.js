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

import Cube from './cube';

/**
 * A cube collection is a container that contains all cubes from the variables of a given project
 *
 * If there is a need to implement queries across multiple cubes, it can be implemented here.
 */
export default class CubeCollection {

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
