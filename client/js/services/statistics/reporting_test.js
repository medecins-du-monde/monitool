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


describe('mtReporting', function() {

	// Load service before each test.
	var mtReporting, Input;
	beforeEach(module("monitool.services.statistics.reporting"));
	beforeEach(module("monitool.services.models.input"));

	beforeEach(inject(function(_mtReporting_, _Input_) {
		mtReporting = _mtReporting_;
		Input = _Input_;
	}));

	// Init dummy objects
	var form, inputs;

	beforeEach(function() {
		form = {
			id: "myForm",
			elements: [
				{
					id: "number_of_doctors",
					geoAgg: "sum", timeAgg: "sum",
					partitions: []
				},
				{
					id: "number_of_consultations",
					geoAgg: "sum", timeAgg: "sum",
					partitions: [
						[
							{id: "male"},
							{id: "female"}
						],
						[
							{id: "under_15"},
							{id: "between_15_and_20"},
							{id: "over_20"}
						]
					]
				}
			]
		};

		inputs = [
			new Input({
				period: "2010-01-02", form: "myForm", entity: "lyon",
				values: {}
			}),

			new Input({
				period: "2010-01-04", form: "myForm", entity: "paris",
				values: {
					"number_of_doctors": [1],
					"number_of_consultations": [2, 3, 4, 5, 6, 7]
				}
			}),

			new Input({
				period: "2010-01-04", form: "myForm", entity: "marseille",
				values: {
					"number_of_doctors": [8],
					"number_of_consultations": [9, 10, 11, 12, 13, 14]
				}
			}),

			new Input({
				period: "2010-00002", form: "myForm", entity: "lyon",
				values: {
					"number_of_doctors": [15],
					"number_of_consultations": [16, 17, 18, 19, 20, 21]
				}
			})
		];
	});

});

