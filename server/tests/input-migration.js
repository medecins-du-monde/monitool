"use strict";

var assert  = require('assert'),
	Project = require('../models/resources/project');

var oldForm = {
	id: "formId",
	elements: [
		{
			id: "element1",
			partitions: [
				{
					id: "gender",
					elements: [{id: 'male'}, {id: 'female'}],
					aggregate: 'sum'
				},
				{
					id: "age",
					elements: [{id: 'under_10'}, {id: 'between_10_and_15'}, {id: 'over_15'}],
					aggregate: 'sum'
				},
				{
					id: "somth",
					elements: [{id: 'something'}, {id: 'something_else'}],
					aggregate: 'average'
				}
			]
		},
		{
			id: "element2",
			partitions: []
		}
	]
};


describe('Input Migration', function() {

	it('getFieldIndex should work with all combinations', function() {
		var partitions = oldForm.elements[0].partitions;

		assert.equal(Project._getFieldIndex(partitions, ['male', 'under_10', 'something']),					0);
		assert.equal(Project._getFieldIndex(partitions, ['male', 'under_10', 'something_else']),			1);
		assert.equal(Project._getFieldIndex(partitions, ['male', 'between_10_and_15', 'something']),		2);
		assert.equal(Project._getFieldIndex(partitions, ['male', 'between_10_and_15', 'something_else']),	3);
		assert.equal(Project._getFieldIndex(partitions, ['male', 'over_15', 'something']),					4);
		assert.equal(Project._getFieldIndex(partitions, ['male', 'over_15', 'something_else']),				5);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'under_10', 'something']),				6);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'under_10', 'something_else']),			7);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'between_10_and_15', 'something']),		8);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'between_10_and_15', 'something_else']),	9);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'over_15', 'something']),				10);
		assert.equal(Project._getFieldIndex(partitions, ['female', 'over_15', 'something_else']),			11);
	});

	it('getFieldIndex should raise an error with invalid input', function() {
		var partitions = oldForm.elements[0].partitions;

		// invalid partition id
		assert.throws(Project._getFieldIndex.bind(null, partitions, ['male', 'under_11', 'something']));
		
		// combination too short.
		assert.throws(Project._getFieldIndex.bind(null, partitions, ['male', 'under_10']));

		// combination too long.
		assert.throws(Project._getFieldIndex.bind(null, partitions, ['male', 'under_10', 'something', 'invalid']));
	});

	it('getPartitionElementIds should work with all indexes', function() {
		var partitions = oldForm.elements[0].partitions;

		assert.deepEqual(Project._getPartitionElementIds(partitions, 0),	['male', 'under_10', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 1),	['male', 'under_10', 'something_else']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 2),	['male', 'between_10_and_15', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 3),	['male', 'between_10_and_15', 'something_else']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 4),	['male', 'over_15', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 5),	['male', 'over_15', 'something_else']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 6),	['female', 'under_10', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 7),	['female', 'under_10', 'something_else']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 8),	['female', 'between_10_and_15', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 9),	['female', 'between_10_and_15', 'something_else']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 10),	['female', 'over_15', 'something']);
		assert.deepEqual(Project._getPartitionElementIds(partitions, 11),	['female', 'over_15', 'something_else']);
	});

	it('getPartitionElementIds should raise an error with invalid input', function() {
		var partitions = oldForm.elements[0].partitions;

		// invalid partition id
		assert.throws(Project._getPartitionElementIds.bind(null, partitions, -1));
		assert.throws(Project._getPartitionElementIds.bind(null, partitions, 12));
	});

});

describe('Input correction', function() {

	var oldInputs = [
		{
			values: {
				element1: [
					0,	// male		under_10			something
					1,	// male		under_10			something_else
					2,	// male		between_10_and_15	something
					3,	// male		between_10_and_15	something_else
					4,	// male		over_15				something
					5,	// male		over_15				something_else
					6,	// female	under_10			something
					7,	// female	under_10			something_else
					8,	// female	between_10_and_15	something
					9,	// female	between_10_and_15	something_else
					10,	// female	over_15				something
					11	// female	over_15				something_else
				],
				element2: [99]
			}
		}
	];

	it('correctInput should do nothing if the form was not updated', function() {
		var inputs = JSON.parse(JSON.stringify(oldInputs));
		Project._correctFormInputs(oldForm, oldForm, inputs);

		assert.deepEqual(inputs, oldInputs);
	});

	it('Inverting two elements should not change anything', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		var tmp = newForm.elements[0];
		newForm.elements[0] = newForm.elements[1];
		newForm.elements[1] = tmp;

		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(oldInputs, inputs);
	});


	it('Adding elements should create the new elements in new inputs', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements.push({id: 'element3', partitions: []});
		newForm.elements.push({id: 'element4', partitions: [{id: 'gender', elements: [{id: 'male'}, {id: 'female'}]}]});
		
		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
				element2: [99],
				element3: [0],
				element4: [0, 0]
			}
		}]);
	});

	it('Removing an element should remove that element from inputs', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements.splice(0, 1);
		
		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element2: [99]
			}
		}])
	});

	it('Adding a partition should reset the whole field to zeros', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements[0].partitions.push({id: "location", elements: [{id: 'madrid'}, {id: 'paris'}]});

		Project._correctFormInputs(oldForm, newForm, inputs);
		
		assert.deepEqual(inputs, [{
			values: {
				element1: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				element2: [99]
			}
		}])
	});

	it('Removing a partition should aggregate the values (sum).', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements[0].partitions.splice(0, 1);

		Project._correctFormInputs(oldForm, newForm, inputs);
		
		assert.deepEqual(inputs, [{
			values: {
				element1: [6, 8, 10, 12, 14, 16],
				element2: [99]
			}
		}]);
	});

	it('Removing a partition should aggregate the values (average).', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements[0].partitions.splice(2, 1);

		Project._correctFormInputs(oldForm, newForm, inputs);
		
		assert.deepEqual(inputs, [{
			values: {
				element1: [0.5, 2.5, 4.5, 6.5, 8.5, 10.5],
				element2: [99]
			}
		}]);
	});

	it('Reordering a partition should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));
		
		var tmp = newForm.elements[0].partitions[0];
		newForm.elements[0].partitions[0] = newForm.elements[0].partitions[1];
		newForm.elements[0].partitions[1] = tmp;

		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element1: [0, 1, 6, 7, 2, 3, 8, 9, 4, 5, 10, 11],
				element2: [99]
			}
		}]);
	});

	it('Adding a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements[0].partitions[0].elements.push({id: 'transexual'});
		
		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 0, 0, 0, 0, 0],
				element2: [99]
			}
		}]);
	});

	it('Removing a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		newForm.elements[0].partitions[0].elements.splice(0, 1);
		
		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element1: [6, 7, 8, 9, 10, 11],
				element2: [99]
			}
		}]);
	});

	it('Reordering a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		var inputs = JSON.parse(JSON.stringify(oldInputs));

		var tmp = newForm.elements[0].partitions[0].elements[0];
		newForm.elements[0].partitions[0].elements[0] = newForm.elements[0].partitions[0].elements[1];
		newForm.elements[0].partitions[0].elements[1] = tmp;

		Project._correctFormInputs(oldForm, newForm, inputs);

		assert.deepEqual(inputs, [{
			values: {
				element1: [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5],
				element2: [99]
			}
		}]);
	});
});


describe('Form comparison', function() {

	var extractInfo = Project._extractRelevantInformation;

	var oldForm = {
		id: "formId",
		elements: [
			{
				id: "element1",
				partitions: [
					{ id: "gender", elements: [{id: 'male'}, {id: 'female'}], groups: [] },
					{ id: "age", elements: [{id: 'under_10'}, {id: 'between_10_and_15'}, {id: 'over_15'}], groups: [] },
					{ id: "somth", elements: [{id: 'something'}, {id: 'something_else'}], groups: [] }
				]
			},
			{
				id: 'element2',
				partitions: [
					{ id: "gender", elements: [{id: 'male'}, {id: 'female'}], groups: [] }
				]
			}
		]
	};

	it('Inverting two elements should not change anything', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		
		var tmp = newForm.elements[0];
		newForm.elements[0] = newForm.elements[1];
		newForm.elements[1] = tmp;

		assert.equal(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Adding an element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements.push({id: 'element3', partitions: []});
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Removing an element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements.splice(0, 1);
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Adding a partition should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements[0].partitions.push({id: "location", elements: [{id: 'madrid'}, {id: 'paris'}]});
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Removing a partition should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements[0].partitions.splice(0, 1);
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Reordering a partition should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		
		var tmp = newForm.elements[0].partitions[0];
		newForm.elements[0].partitions[0] = newForm.elements[0].partitions[1];
		newForm.elements[0].partitions[1] = tmp;

		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Adding a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements[0].partitions[0].elements.push({id: 'transexual'});
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Removing a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		newForm.elements[0].partitions[0].elements.splice(0, 1);
		
		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

	it('Reordering a partition element should change the result', function() {
		var newForm = JSON.parse(JSON.stringify(oldForm));
		
		var tmp = newForm.elements[0].partitions[0].elements[0];
		newForm.elements[0].partitions[0].elements[0] = newForm.elements[0].partitions[0].elements[1];
		newForm.elements[0].partitions[0].elements[1] = tmp;

		assert.notEqual(extractInfo(oldForm), extractInfo(newForm));
	});

});

