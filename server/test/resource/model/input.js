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

let assert = require('assert'),
	Project = require('../../../resource/model/project'),
	Input  = require('../../../resource/model/input');




// var oldForm = ;

describe("Input migration", function() {
	let formerProject;
	let newProject, input;


	before(function() {
		formerProject = new Project({
			_id: "624c94fa-9ebc-4f8b-8389-f5959149a0a7",
			type: "project",
			country: "testCountry",
			name: "testProject",
			start: "2010-01-01",
			end: "2014-01-01",
			entities: [
				{id: "0c243e08-8c21-4946-9f5f-ce255106901b", name: "location1"}
			],
			groups: [],
			users: [],
			themes: [],
			logicalFrames: [],
			crossCutting: {},
			extraIndicators: [],
			forms: [
				{
					id: "8a7980f8-0e47-49bb-bf54-fdbe2013e3ea",
					name: "whatever",
					collect: "entity",
					periodicity: "month",
					start: null,
					end: null,
					elements: [
						{
							id: "c0cdae8e-4ebb-41e3-a68e-d8247d3ca7ce",
							name: "whatever",
							timeAgg: "sum",
							geoAgg: "sum",
							order: 0,
							distribution: 0,
							partitions: [
								{
									id: "a7623d67-6cf0-42eb-b5b5-1d8c8dada396",
									name: "whatever",
									elements: [
										{id: 'bcda5c13-6b48-4a4c-82a9-21947b51459d', name: "whatever"},
										{id: 'bcda5c13-6b48-4a4c-82a9-21947b51459d', name: "whatever2"}
									],
									groups: [],
									aggregate: 'sum'
								},
								{
									id: "104b93c3-8d50-43b5-b149-4bf8d80a850a",
									name: "whatever",
									elements: [
										{id: '26ca342c-f119-429a-9e11-0ef82f541376', name: "whatever"},
										{id: '8e568d78-e844-4563-9ff8-ecab5af06b31', name: "whatever2"},
										{id: '39ded232-3801-4745-ab7a-04e29371c0d5', name: "whatever3"}
									],
									groups: [],
									aggregate: 'sum'
								},
								{
									id: "53ef3c3e-5dfc-411a-9c0f-4df7e52b6bc9",
									name: "whatever",
									elements: [
										{id: 'e33904be-4c43-4e58-a3cb-45d272212cd5', name: "whatever"},
										{id: 'c71bd1cb-1acd-4b7b-9933-4aebdbe4be4f', name: "whatever"}
									],
									groups: [],
									aggregate: 'average'
								}
							]
						},
						{
							id: "a83cda13-fbc7-477d-b158-33077a243c81",
							name: "whatever",
							timeAgg: "sum",
							geoAgg: "sum",
							order: 0,
							distribution: 0,
							partitions: []
						}
					]
				}
			]
		});
	});

	beforeEach(function() {
		newProject = formerProject.clone();
		input = formerInput.clone();
	});

	describe('start_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('end_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('entities_add', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('entities_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('entities_start_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('entities_end_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_periodicity_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_collect_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_start_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_end_replace', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_entities_add', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_entities_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_add', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_partitions_add', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_partitions_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_partitions_elements_add', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

	describe('forms_elements_partitions_elements_remove', function() {
		beforeEach(function() {

		});

		it('', function() {

		});

	});

});





// describe('Input correction', function() {

// 	var oldInputs = [
// 		{
// 			values: {
// 				element1: [
// 					0,	// male		under_10			something
// 					1,	// male		under_10			something_else
// 					2,	// male		between_10_and_15	something
// 					3,	// male		between_10_and_15	something_else
// 					4,	// male		over_15				something
// 					5,	// male		over_15				something_else
// 					6,	// female	under_10			something
// 					7,	// female	under_10			something_else
// 					8,	// female	between_10_and_15	something
// 					9,	// female	between_10_and_15	something_else
// 					10,	// female	over_15				something
// 					11	// female	over_15				something_else
// 				],
// 				element2: [99]
// 			}
// 		}
// 	];

// 	it('correctInput should do nothing if the form was not updated', function() {
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));
// 		Project._correctFormInputs(oldForm, oldForm, inputs);

// 		assert.deepEqual(inputs, oldInputs);
// 	});

// 	it('Inverting two elements should not change anything', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		var tmp = newForm.elements[0];
// 		newForm.elements[0] = newForm.elements[1];
// 		newForm.elements[1] = tmp;

// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(oldInputs, inputs);
// 	});


// 	it('Adding elements should create the new elements in new inputs', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements.push({id: 'element3', partitions: []});
// 		newForm.elements.push({id: 'element4', partitions: [{id: 'gender', elements: [{id: 'male'}, {id: 'female'}]}]});
		
// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
// 				element2: [99],
// 				element3: [0],
// 				element4: [0, 0]
// 			}
// 		}]);
// 	});

// 	it('Removing an element should remove that element from inputs', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements.splice(0, 1);
		
// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element2: [99]
// 			}
// 		}])
// 	});

// 	it('Adding a partition should reset the whole field to zeros', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements[0].partitions.push({id: "location", elements: [{id: 'madrid'}, {id: 'paris'}]});

// 		Project._correctFormInputs(oldForm, newForm, inputs);
		
// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
// 				element2: [99]
// 			}
// 		}])
// 	});

// 	it('Removing a partition should aggregate the values (sum).', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements[0].partitions.splice(0, 1);

// 		Project._correctFormInputs(oldForm, newForm, inputs);
		
// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [6, 8, 10, 12, 14, 16],
// 				element2: [99]
// 			}
// 		}]);
// 	});

// 	it('Removing a partition should aggregate the values (average).', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements[0].partitions.splice(2, 1);

// 		Project._correctFormInputs(oldForm, newForm, inputs);
		
// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [0.5, 2.5, 4.5, 6.5, 8.5, 10.5],
// 				element2: [99]
// 			}
// 		}]);
// 	});

// 	it('Reordering a partition should change the result', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));
		
// 		var tmp = newForm.elements[0].partitions[0];
// 		newForm.elements[0].partitions[0] = newForm.elements[0].partitions[1];
// 		newForm.elements[0].partitions[1] = tmp;

// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [0, 1, 6, 7, 2, 3, 8, 9, 4, 5, 10, 11],
// 				element2: [99]
// 			}
// 		}]);
// 	});

// 	it('Adding a partition element should change the result', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements[0].partitions[0].elements.push({id: 'transexual'});
		
// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 0, 0, 0, 0, 0],
// 				element2: [99]
// 			}
// 		}]);
// 	});

// 	it('Removing a partition element should change the result', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		newForm.elements[0].partitions[0].elements.splice(0, 1);
		
// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [6, 7, 8, 9, 10, 11],
// 				element2: [99]
// 			}
// 		}]);
// 	});

// 	it('Reordering a partition element should change the result', function() {
// 		var newForm = JSON.parse(JSON.stringify(oldForm));
// 		var inputs = JSON.parse(JSON.stringify(oldInputs));

// 		var tmp = newForm.elements[0].partitions[0].elements[0];
// 		newForm.elements[0].partitions[0].elements[0] = newForm.elements[0].partitions[0].elements[1];
// 		newForm.elements[0].partitions[0].elements[1] = tmp;

// 		Project._correctFormInputs(oldForm, newForm, inputs);

// 		assert.deepEqual(inputs, [{
// 			values: {
// 				element1: [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5],
// 				element2: [99]
// 			}
// 		}]);
// 	});
// });
