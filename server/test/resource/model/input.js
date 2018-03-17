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

require('../../mock-database');

let assert     = require('assert'),
	Project    = require('../../../resource/model/project'),
	DataSource = require('../../../resource/model/data-source'),
	Variable   = require('../../../resource/model/variable'),
	Input      = require('../../../resource/model/input');


describe("Input", function() {

	describe('update', function() {
		let oldProject, newProject, oldInput, input;

		before("create project and input", function() {
			oldProject = new Project(require('../../data/project.json'));
			oldInput = new Input(require('../../data/input.json'));
		});

		beforeEach(function() {
			newProject = new Project(JSON.parse(JSON.stringify(oldProject)));
			input = new Input(JSON.parse(JSON.stringify(oldInput)));
		});

		it('no change', function() {
			assert.equal(false, input.update(oldProject, newProject));
		});

		it('remove form', function() {
			newProject.forms.splice(0, 1);

			assert.equal(true, input.update(oldProject, newProject));
			assert.equal(input._deleted, true);
		});

		it('adding a simple variable shoud add one zero', function() {
			newProject.forms[0].elements.push(new Variable({
				id: '03ca15e3-6dab-438a-bbb0-40a673df547e',
				name: "newVariable",
				timeAgg: 'sum', geoAgg: 'sum', order: 0, distribution: 0, partitions: []
			}));

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1],
				'03ca15e3-6dab-438a-bbb0-40a673df547e': [0]
			});
		});

		it('adding a variable with a partition shoud add two zeros', function() {
			newProject.forms[0].elements.push(new Variable({
				id: '03ca15e3-6dab-438a-bbb0-40a673df547e',
				name: "newVariable",
				timeAgg: 'sum', geoAgg: 'sum', order: 0, distribution: 0,
				partitions: [
					{
						id: "b0c9849f-c1ae-437d-ba93-2d52879455a1",
						name: "whatever",
						elements: [
							{id: '7fa4cf21-a350-4a85-a095-941392201a9e', name: "whatever"},
							{id: '0391baaa-4e2e-4d3f-a85d-4bf03b6f26a4', name: "whatever2"}
						],
						groups: [],
						aggregation: 'sum'
					}
				]
			}));

			assert.equal(true, input.update(oldProject, newProject));

			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1],
				'03ca15e3-6dab-438a-bbb0-40a673df547e': [0, 0]
			});
		});

		it('removing a variable shoud remove the entry', function() {
			newProject.forms[0].elements.splice(0, 1);

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('removing another variable shoud remove the entry', function() {
			newProject.forms[0].elements.splice(1, 1);

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
			});
		});

		it('adding a partition at the back should move all data to the first element of that partition', function() {
			newProject.forms[0].elements[0].partitions.push({
				id: "b0c9849f-c1ae-437d-ba93-2d52879455a1",
				name: "whatever",
				elements: [
					{id: '7fa4cf21-a350-4a85-a095-941392201a9e', name: "whatever"},
					{id: '0391baaa-4e2e-4d3f-a85d-4bf03b6f26a4', name: "whatever2"}
				],
				groups: [],
				aggregation: 'sum'
			});

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0, 10, 0, 11, 0, 12, 0
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('adding a partition in front should move all data to the first element of that partition', function() {
			newProject.forms[0].elements[0].partitions.unshift({
				id: "b0c9849f-c1ae-437d-ba93-2d52879455a1",
				name: "whatever",
				elements: [
					{id: '7fa4cf21-a350-4a85-a095-941392201a9e', name: "whatever"},
					{id: '0391baaa-4e2e-4d3f-a85d-4bf03b6f26a4', name: "whatever2"}
				],
				groups: [],
				aggregation: 'sum'
			});

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('adding a partition elements on the beginning of first partition should update the data', function() {
			newProject.forms[0].elements[0].partitions[0].elements.push({
				'id': '717a2728-c82c-426a-9198-88bd54821f0d',
				'name': 'newElement'
			});

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0, 0, 0, 0, 0, 0
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		})

		it('adding a partition elements on the middle first partition should update the data', function() {
			newProject.forms[0].elements[0].partitions[0].elements.splice(1, 0, {
				'id': '717a2728-c82c-426a-9198-88bd54821f0d',
				'name': 'newElement'
			});

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					1, 2, 3, 4, 5, 6, 0, 0, 0, 0, 0, 0, 7, 8, 9, 10, 11, 12
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('adding a partition elements on the middle of the second partition should update the data', function() {
			newProject.forms[0].elements[0].partitions[1].elements.splice(1, 0, {
				'id': '717a2728-c82c-426a-9198-88bd54821f0d',
				'name': 'newElement'
			});

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					1, 2, 0, 0, 3, 4, 5, 6, 7, 8, 0, 0, 9, 10, 11, 12
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('removing a partition element 1', function() {
			newProject.forms[0].elements[0].partitions[0].elements.splice(0, 1);

			assert.equal(true, input.update(oldProject, newProject));
			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					7, 8, 9, 10, 11, 12
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('reordering partition elements', function() {
			newProject.forms[0].elements[0].partitions.forEach(function(partition) {
				partition.elements.reverse();
			});

			assert.equal(true, input.update(oldProject, newProject));

			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});

		it('removing a partition', function() {
			newProject.forms[0].elements[0].partitions.splice(2, 1);

			assert.equal(true, input.update(oldProject, newProject));

			assert.deepEqual(input.values, {
				'c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce': [
					3, 7, 11, 15, 19, 23
				],
				'a83cda13-fbc7-477d-b158-33077a243c81': [1]
			});
		});
	});
});
