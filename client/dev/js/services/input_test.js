
describe('Input', function() {

	// Load service before each test.
	var Input;
	beforeEach(module("monitool.services.models.input"));
	beforeEach(inject(function(_Input_) {
		Input = _Input_;
	}));

	// Init dummy objects
	var form = {
		id: "myForm",
		elements: [
			{
				id: "number_of_doctors",
				partitions: []
			},
			{
				id: "number_of_consultations",
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

	it('Sanitize should work on empty model', function() {
		var input = new Input({
			period: "2010-01-02",
			form: "myForm",
			values: {}
		});

		input.sanitize(form);

		expect(input.values).toEqual({
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

	it('Sanitize should work on partial model', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_consultations": {
					"female.under_15": 16,
					"between_15_and_20.female": 32,
					"female.over_20": 64
				}
			}
		});

		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": {'': 0},
			"number_of_consultations": {
				"male.under_15": 0,
				"between_15_and_20.male": 0,
				"male.over_20": 0,
				"female.under_15": 16,
				"between_15_and_20.female": 32,
				"female.over_20": 64
			}
		});
	});

	it('Sanitize should work on full model', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_doctors": {'': 1},
				"number_of_consultations": {
					"male.under_15": 2,
					"between_15_and_20.male": 4,
					"male.over_20": 8,
					"female.under_15": 16,
					"between_15_and_20.female": 32,
					"female.over_20": 64
				}
			}
		});

		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": {'': 1},
			"number_of_consultations": {
				"male.under_15": 2,
				"between_15_and_20.male": 4,
				"male.over_20": 8,
				"female.under_15": 16,
				"between_15_and_20.female": 32,
				"female.over_20": 64
			}
		});
	});

	it('Sanitize should drop useless data', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_doctors": {'': 1},
				"number_of_consultations": {
					"male.under_15": 2,
					"between_15_and_20.male": 4,
					"male.over_20": 8,
					"male.over_50": 8,
					"female.under_15": 16,
					"between_15_and_20.female": 32,
					"female.over_20": 64,
					"female.over_50": 8
				}
			}
		});
		
		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": {'': 1},
			"number_of_consultations": {
				"male.under_15": 2,
				"between_15_and_20.male": 4,
				"male.over_20": 8,
				"female.under_15": 16,
				"between_15_and_20.female": 32,
				"female.over_20": 64
			}
		});
	});

	it("computeSums should work", function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_doctors": {'': 1},
				"number_of_consultations": {
					"male.under_15": 1,
					"between_15_and_20.male": 2,
					"male.over_20": 4,
					"female.under_15": 8,
					"between_15_and_20.female": 16,
					"female.over_20": 32
				}
			}
		});

		expect(input.computeSums()).toEqual({
			'number_of_doctors': {'': 1},
			'number_of_consultations': {
				'': 1 + 2 + 4 + 8 + 16 + 32,

				'male': 1 + 2 + 4,
				'female': 8 + 16 + 32,

				'under_15': 1 + 8,
				'between_15_and_20': 2 + 16,
				'over_20': 4 + 32,

				'male.under_15': 1,
				'between_15_and_20.male': 2,
				'male.over_20': 4,
				'female.under_15': 8,
				'between_15_and_20.female': 16,
				'female.over_20': 32
			}
		});
	});
});
