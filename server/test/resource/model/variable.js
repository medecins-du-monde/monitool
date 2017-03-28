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

var assert   = require('assert'),
	Variable = require('../../../resource/model/variable');


describe('Variable', function() {
	let variable;

	before(function() {
		variable = new Variable({
			id: "b66386f8-da00-41ef-a28b-c7341d646250",
			name: "Number of something",
			timeAgg: "sum", geoAgg: "sum", order: 0, distribution: 0,
			partitions: [
				{
					id: "930d9e11-6a76-4bf1-8d48-8fd376ac78fc",
					name: "gender",
					elements: [
						{id: "ebe7b9bc-2a8b-4b3f-a165-49155fab5a71", name: "male"},
						{id: "ff31ce75-a79d-45d7-8a53-4568ef02915f", name: "female"}
					],
					groups: [],
					aggregation: "sum"
				},
				{
					id: "22e23b9c-2fb9-48a3-880f-b6bebf15a213",
					name: "age",
					elements: [
						{id: "60530455-44f7-4ba1-9d5f-6297d74885ce", name: "under_10"},
						{id: "b0ced003-6ba0-4e9e-92b6-0918e0cb15df", name: "between_10_and_15"},
						{id: "98f14009-7574-4e6d-86a5-46a1bb650072", name: "over_15"}
					],
					groups: [],
					aggregation: "sum"
				},
				{
					id: "00d65eab-aaa0-4638-80ca-382885ff9155",
					name: "somth",
					elements: [
						{id: "89987402-3a45-40ea-89d4-9b4e01e8d706", name: "something"},
						{id: "e3ba2b72-d265-4a09-9f7b-1ad22dffaf17", name: "something_else"}
					],
					groups: [],
					aggregation: "sum"
				}
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
			newVariable.partitions.push({
				id: "1dc4bb4f-9b03-458f-bd88-bbb3ad00b14c",
				name: "location",
				elements: [
					{id: '271e66b0-94b0-46d8-9670-dc21aaad0168', name: "madrid"},
					{id: '377f1eda-87de-42c4-a254-a601e0c28089', name: "paris"}
				],
				groups: [],
				aggregation: "sum"
			});

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
			newVariable.partitions[0].elements.push({
				id: "78d55053-ee42-480e-9028-c78dcae290c1",
				name: 'transexual'
			});

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
			let index = variable.computeFieldIndex([
				"ebe7b9bc-2a8b-4b3f-a165-49155fab5a71", // male
				"60530455-44f7-4ba1-9d5f-6297d74885ce", // under_10
				"89987402-3a45-40ea-89d4-9b4e01e8d706"  // something
			]);

			assert.equal(index, 0);
		});

		it('should give a 6', function() {
			let index = variable.computeFieldIndex([
				"ff31ce75-a79d-45d7-8a53-4568ef02915f", // female
				"60530455-44f7-4ba1-9d5f-6297d74885ce", // under_10
				"89987402-3a45-40ea-89d4-9b4e01e8d706"  // something
			]);

			assert.equal(index, 6);
		});

		it('should give 11', function() {
			let index = variable.computeFieldIndex([
				"ff31ce75-a79d-45d7-8a53-4568ef02915f", // female
				"98f14009-7574-4e6d-86a5-46a1bb650072", // over_15
				"e3ba2b72-d265-4a09-9f7b-1ad22dffaf17"  // something_else
			]);

			assert.equal(index, 11);
		});

		it('should raise (too short)', function() {
			assert.throws(() => variable.computeFieldIndex([
				"ff31ce75-a79d-45d7-8a53-4568ef02915f",
				"98f14009-7574-4e6d-86a5-46a1bb650072"
			]));
		});

		it('should raise (too long)', function() {
			assert.throws(() => variable.computeFieldIndex([
				"ff31ce75-a79d-45d7-8a53-4568ef02915f", // female
				"98f14009-7574-4e6d-86a5-46a1bb650072", // over_15
				"e3ba2b72-d265-4a09-9f7b-1ad22dffaf17", // something_else
				"e3ba2b72-d265-4a09-9f7b-1ad22dffaf17"  // something_else
			]));
		});

		it('should raise (invalid)', function() {
			assert.throws(() => variable.computeFieldIndex(["female", "wwww", "something_else"]));
		});
	});

	describe("computePartitionElementIds", function() {

		it('should give [male, under_10, something]', function() {
			let ids = variable.computePartitionElementIds(0);

			assert.deepEqual(ids, [
				"ebe7b9bc-2a8b-4b3f-a165-49155fab5a71", // male
				"60530455-44f7-4ba1-9d5f-6297d74885ce", // under_10
				"89987402-3a45-40ea-89d4-9b4e01e8d706"  // something
			]);
		});

		it('should give [female, under_10, something]', function() {
			let ids = variable.computePartitionElementIds(6);

			assert.deepEqual(ids, [
				"ff31ce75-a79d-45d7-8a53-4568ef02915f", // female
				"60530455-44f7-4ba1-9d5f-6297d74885ce", // under_10
				"89987402-3a45-40ea-89d4-9b4e01e8d706"  // something
			]);
		});

		it('should give [female, over_15, something_else]', function() {
			let ids = variable.computePartitionElementIds(11);

			assert.deepEqual(ids, [
				"ff31ce75-a79d-45d7-8a53-4568ef02915f", // female
				"98f14009-7574-4e6d-86a5-46a1bb650072", // over_15
				"e3ba2b72-d265-4a09-9f7b-1ad22dffaf17"  // something_else
			]);
		});

		it('should raise (too low)', function() {
			assert.throws(() => variable.computePartitionElementIds(-1));
		});

		it('should raise (too high)', function() {
			assert.throws(() => variable.computePartitionElementIds(12));
		});
	});

});

