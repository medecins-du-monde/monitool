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

const assert = require('assert');
const { findSimilarProjects } = require('../../lib/utils/clone-review');

const clone = { _id: 'project:clone', name: 'Health Mali', countries: ['ML'], start: '2024-01-01', end: '2024-12-31' };

function project(fields) {
	return Object.assign({ _id: 'project:other', name: 'Other', countries: ['FR'], start: '2024-01-01', end: '2024-12-31', active: true }, fields);
}

describe('findSimilarProjects', function() {

	it('should match a project with the same name, ignoring case and spaces', function() {
		const result = findSimilarProjects(clone, [project({ name: '  health mali ' })]);
		assert.deepEqual(result.map(p => p._id), ['project:other']);
	});

	it('should not match a project with another name, even in the same country and period', function() {
		const result = findSimilarProjects(clone, [project({ name: 'Nutrition Mali', countries: ['ML'] })]);
		assert.equal(result.length, 0);
	});

	it('should exclude inactive projects and the project itself', function() {
		const result = findSimilarProjects(clone, [
			project({ name: 'Health Mali', active: false }),
			project(Object.assign({}, clone, { active: true }))
		]);
		assert.equal(result.length, 0);
	});
});
