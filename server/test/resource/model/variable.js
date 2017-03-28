"use strict";

var assert   = require('assert'),
	Variable = require('../../../resource/model/variable');


describe('Variable', function() {
	let variable;

	before(function() {
		variable = new Variable({
			id: "element1",
			partitions: [
				{ id: "gender", elements: [{id: 'male'}, {id: 'female'}], groups: [] },
				{ id: "age", elements: [{id: 'under_10'}, {id: 'between_10_and_15'}, {id: 'over_15'}], groups: [] },
				{ id: "somth", elements: [{id: 'something'}, {id: 'something_else'}], groups: [] }
			]
		});
	});

	describe("signature", function() {

		let newVariable;

		beforeEach(function() {
			newVariable = new Variable(JSON.parse(JSON.stringify(variable)));
		});

		it('Renaming a partition should not change the result', function() {
			newVariable.partitions[0].name = 'whatever';

			assert.equal(variable.signature, newVariable.signature);
		});

		it('Renaming a partition element should not change the result', function() {
			newVariable.partitions[0].elements[0].name = 'whatever';

			assert.equal(variable.signature, newVariable.signature);
		});

		it('Adding a partition should change the result', function() {
			newVariable.partitions.push({id: "location", elements: [{id: 'madrid'}, {id: 'paris'}]});

			assert.notEqual(variable.signature, newVariable.signature);
		});

		it('Removing a partition should change the result', function() {
			newVariable.partitions.splice(0, 1);

			assert.notEqual(variable.signature, newVariable.signature);
		});

		it('Reordering a partition should change the result', function() {
			var tmp = newVariable.partitions[0];
			newVariable.partitions[0] = newVariable.partitions[1];
			newVariable.partitions[1] = tmp;

			assert.notEqual(variable.signature, newVariable.signature);
		});

		it('Adding a partition element should change the result', function() {
			newVariable.partitions[0].elements.push({id: 'transexual'});

			assert.notEqual(variable.signature, newVariable.signature);
		});

		it('Removing a partition element should change the result', function() {
			newVariable.partitions[0].elements.splice(0, 1);

			assert.notEqual(variable.signature, newVariable.signature);
		});

		it('Reordering a partition element should change the result', function() {
			var tmp = newVariable.partitions[0].elements[0];
			newVariable.partitions[0].elements[0] = newVariable.partitions[0].elements[1];
			newVariable.partitions[0].elements[1] = tmp;

			assert.notEqual(variable.signature, newVariable.signature);
		});
	});

	describe("numValues", function() {

		it('should be 12', function() {
			assert.equal(variable.numValues, 12);
		});

	});

	describe("computeFieldIndex", function() {

		it('should give 0', function() {
			let index = variable.computeFieldIndex(["male", "under_10", "something"]);
			assert.equal(index, 0);
		});

		it('should give a 6', function() {
			let index = variable.computeFieldIndex(["female", "under_10", "something"]);
			assert.equal(index, 6);
		});

		it('should give 11', function() {
			let index = variable.computeFieldIndex(["female", "over_15", "something_else"]);
			assert.equal(index, 11);
		});

		it('should raise (too short)', function() {
			assert.throws(() => variable.computeFieldIndex(["female", "over_15"]));
		});

		it('should raise (too long)', function() {
			assert.throws(() => variable.computeFieldIndex(["female", "over_15", "something_else", "something_else"]));
		});

		it('should raise (invalid)', function() {
			assert.throws(() => variable.computeFieldIndex(["female", "wwww", "something_else"]));
		});
	});

	describe("computePartitionElementIds", function() {

		it('should give [male, under_10, something]', function() {
			let ids = variable.computePartitionElementIds(0);
			assert.deepEqual(ids, ["male", "under_10", "something"]);
		});

		it('should give [female, under_10, something]', function() {
			let ids = variable.computePartitionElementIds(6);
			assert.deepEqual(ids, ["female", "under_10", "something"]);
		});

		it('should give [female, over_15, something_else]', function() {
			let ids = variable.computePartitionElementIds(11);
			assert.deepEqual(ids, ["female", "over_15", "something_else"]);
		});

		it('should raise (too low)', function() {
			assert.throws(() => variable.computePartitionElementIds(-1));
		});

		it('should raise (too high)', function() {
			assert.throws(() => variable.computePartitionElementIds(12));
		});
	});

});

