
describe('mtReporting', function() {

	// Load service before each test.
	var mtReporting, Input;
	beforeEach(module("monitool.services.reporting"));
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
					"number_of_doctors": {'': 1},
					"number_of_consultations": {
						"male.under_15": 2,
						"between_15_and_20.male": 3,
						"male.over_20": 4,
						"female.under_15": 5,
						"between_15_and_20.female": 6,
						"female.over_20": 7
					}
				}
			}),

			new Input({
				period: "2010-01-04", form: "myForm", entity: "marseille",
				values: {
					"number_of_doctors": {'': 8},
					"number_of_consultations": {
						"male.under_15": 9,
						"between_15_and_20.male": 10,
						"male.over_20": 11,
						"female.under_15": 12,
						"between_15_and_20.female": 13,
						"female.over_20": 14
					}
				}
			}),

			new Input({
				period: "2010-00002", form: "myForm", entity: "lyon",
				values: {
					"number_of_doctors": {'': 15},
					"number_of_consultations": {
						"male.under_15": 16,
						"between_15_and_20.male": 17,
						"male.over_20": 18,
						"female.under_15": 19,
						"between_15_and_20.female": 20,
						"female.over_20": 21
					}
				}
			})
		];

		inputs.forEach(function(input) { input.sanitize(form); });
	});

	it('should aggregate numbers properly', function() {
		expect(mtReporting._aggregateValues("none", [1, 2, 3])).toEqual('CANNOT_AGGREGATE');
		expect(mtReporting._aggregateValues("sum", [1, 2, 3])).toEqual(6);
		expect(mtReporting._aggregateValues("average", [1, 2, 3])).toEqual(2);
		expect(mtReporting._aggregateValues("highest", [1, 2, 3])).toEqual(3);
		expect(mtReporting._aggregateValues("lowest", [1, 2, 3])).toEqual(1);
		expect(mtReporting._aggregateValues("last", [1, 2, 3])).toEqual(3);
		expect(mtReporting._aggregateValues("sum", ["HELLO", 2, 3])).toEqual('HELLO');
	});

	it('should be able to group multiple inputs by a simple sum', function() {
		form.elements[0].geoAgg = form.elements[0].timeAgg = 'sum';
		form.elements[1].geoAgg = form.elements[1].timeAgg = 'sum';

		var result = mtReporting._groupInputLayer('geoAgg', inputs.slice(), form);

		expect(result.values).toEqual({
			"number_of_doctors": {'': 15 + 8 + 1},
			"number_of_consultations": {
				"male.under_15": 16 + 9 + 2,
				"between_15_and_20.male": 17 + 10 + 3,
				"male.over_20": 18 + 11 + 4,
				"female.under_15": 19 + 12 + 5,
				"between_15_and_20.female": 20 + 13 + 6,
				"female.over_20": 21 + 14 + 7
			}
		});
	});

	it('should be able to average multiple inputs', function() {
		form.elements[0].geoAgg = form.elements[0].timeAgg = 'average';
		form.elements[1].geoAgg = form.elements[1].timeAgg = 'average';

		// group all inputs
		var result = mtReporting._groupInputLayer('geoAgg', inputs.slice(), form);

		expect(result.values).toEqual({
			"number_of_doctors": {'': 24 / 4},
			"number_of_consultations": {
				"male.under_15": 27 / 4,
				"between_15_and_20.male": 30 / 4,
				"male.over_20": 33 / 4,
				"female.under_15": 36 / 4,
				"between_15_and_20.female": 39 / 4,
				"female.over_20": 42 / 4
			}
		});
	});

	it('should fail to group if marked as such', function() {
		var result;

		form.elements[0].geoAgg = form.elements[0].timeAgg = 'none';
		form.elements[1].geoAgg = form.elements[1].timeAgg = 'none';

		// group all inputs
		result = mtReporting._groupInputLayer('geoAgg', inputs.slice(), form);
		expect(result.values).toEqual({
			"number_of_doctors": {'': 'CANNOT_AGGREGATE'},
			"number_of_consultations": {
				"male.under_15": 'CANNOT_AGGREGATE',
				"between_15_and_20.male": 'CANNOT_AGGREGATE',
				"male.over_20": 'CANNOT_AGGREGATE',
				"female.under_15": 'CANNOT_AGGREGATE',
				"between_15_and_20.female": 'CANNOT_AGGREGATE',
				"female.over_20": 'CANNOT_AGGREGATE'
			}
		});

		// group only first one.
		result = mtReporting._groupInputLayer('geoAgg', inputs.slice(0, 1), form);
		expect(result.values).toEqual({
			"number_of_doctors": {'': 0},
			"number_of_consultations": {
				"male.under_15": 0,
				"between_15_and_20.male": 0,
				"male.over_20": 0,
				"female.under_15": 0,
				"between_15_and_20.female": 0,
				"female.over_20": 0
			}
		});
	});

	it('should be able to group inputs', function() {
		var result;

		// number_of_doctors sums and number_of_consultations averages.
		form.elements[0].geoAgg = form.elements[0].timeAgg = 'sum';
		form.elements[1].geoAgg = form.elements[1].timeAgg = 'average';

		// group all inputs
		result = mtReporting._groupInputs({forms: [form]}, inputs.slice());
		
		expect(result.values['number_of_doctors']['']).toEqual(0 + 1 + 8 + 15);

		expect(result.values['number_of_consultations']['male.under_15']).toEqual(
			// on groupe par temps et lieu.
			((0 + 16) / 2 + 2 + 9) / 3
		);
	});

	it('should be able to group inputs when geo and time are different', function() {
		var result;

		// time sum and geo average.
		form.elements[0].geoAgg = 'average';
		form.elements[0].timeAgg = 'sum';
		form.elements[1].geoAgg = 'average';
		form.elements[1].timeAgg = 'sum';

		// group all inputs
		result = mtReporting._groupInputs({forms: [form]}, inputs.slice());

		expect(result.values['number_of_doctors']['']).toEqual(
			((0 + 15) + 1 + 8) / 3
		);

		expect(result.values['number_of_consultations']['male.under_15']).toEqual(
			((0 + 16) + 2 + 9) / 3
		);
	});

});

