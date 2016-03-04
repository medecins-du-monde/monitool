"use strict";

var assert  = require('assert'),
	Project = require('../models/resources/project');

var oldForm = {
	id: "formId",
	elements: [
		{
			id: "elementId",
			name: "Number of consultations",
			partitions: [
				[{id: 'male'}, {id: 'female'}],
				[{id: 'under_10'}, {id: 'between_10_and_15'}, {id: 'over_15'}],
				[{id: 'something'}, {id: 'something_else'}]
			]
		}
	]
};

var oldInput = {
	values: {
		elementId: [
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
		]
	}
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

	it('correctInput should do nothing if the form was not updated', function() {
		var inputs = JSON.parse(JSON.stringify([oldInput]));
		Project._correctFormInputs(oldForm, oldForm, inputs);

		assert.deepEqual(inputs[0].values.elementId, oldInput.values.elementId);
	});

	it('correctInput should work when removing an element', function() {
		var inputs  = JSON.parse(JSON.stringify([oldInput])),
			newForm = JSON.parse(JSON.stringify(oldForm));

		// Remove the age partition
		newForm.elements.splice(0, 1);

		// Rewrite the inputs.
		Project._correctFormInputs(oldForm, newForm, inputs);

		// Check result
		assert.deepEqual(inputs[0].values, {});
	});

	it('correctInput should work when removing a partition', function() {
		var inputs  = JSON.parse(JSON.stringify([oldInput])),
			newForm = JSON.parse(JSON.stringify(oldForm));

		// Remove the age partition
		newForm.elements[0].partitions.splice(1, 1);

		// Rewrite the inputs.
		Project._correctFormInputs(oldForm, newForm, inputs);

		// Check result
		assert.deepEqual(
			inputs[0].values.elementId,
			[
				0 + 2 + 4,	// male		something
				1 + 3 + 5,	// male		something_else
				6 + 8 + 10,	// female	something
				7 + 9 + 11	// female	something_else
			]
		);
	});

	it('correctInput should work when removing a partition element', function() {
		var inputs  = JSON.parse(JSON.stringify([oldInput])),
			newForm = JSON.parse(JSON.stringify(oldForm));

		// Remove men
		newForm.elements[0].partitions[0].splice(0, 1);

		// Rewrite the inputs.
		Project._correctFormInputs(oldForm, newForm, inputs);

		// Check result
		assert.deepEqual(
			inputs[0].values.elementId,
			[
				6,	// female	under_10			something
				7,	// female	under_10			something_else
				8,	// female	between_10_and_15	something
				9,	// female	between_10_and_15	something_else
				10,	// female	over_15				something
				11	// female	over_15				something_else
			]
		);
	});

	it('correctInput should work when adding an element', function() {
		var inputs  = JSON.parse(JSON.stringify([oldInput])),
			newForm = JSON.parse(JSON.stringify(oldForm));

		// Remove the age partition
		newForm.elements.push({id: "elementId2", partitions: []});

		// Rewrite the inputs.
		Project._correctFormInputs(oldForm, newForm, inputs);

		// Check result
		assert.deepEqual(inputs[0].values.elementId2, [0]);
	});


	it('correctInput should reset the inputs to zero if the form is not upgradable (add partition)', function() {
		var inputs = JSON.parse(JSON.stringify([oldInput])),
			newForm = JSON.parse(JSON.stringify(oldForm));

		// Add a new partition
		newForm.elements[0].partitions.push([{id: 'new'}, {id: 'partition'}]);

		// Rewrite the inputs.
		Project._correctFormInputs(oldForm, newForm, inputs);

		// Check result
		assert.deepEqual(
			inputs[0].values.elementId,
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 24 zeros
		);
	});

});


