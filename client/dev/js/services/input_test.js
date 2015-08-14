
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
		sections: [
			{
				id: "section1",
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
			"number_of_doctors": 0,
			"number_of_consultations.male.under_15": 0,
			"number_of_consultations.between_15_and_20.male": 0,
			"number_of_consultations.male.over_20": 0,
			"number_of_consultations.female.under_15": 0,
			"number_of_consultations.between_15_and_20.female": 0,
			"number_of_consultations.female.over_20": 0
		});
	});

	it('Sanitize should work on partial model', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_consultations.female.under_15": 16,
				"number_of_consultations.between_15_and_20.female": 32,
				"number_of_consultations.female.over_20": 64
			}
		});

		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": 0,
			"number_of_consultations.male.under_15": 0,
			"number_of_consultations.between_15_and_20.male": 0,
			"number_of_consultations.male.over_20": 0,
			"number_of_consultations.female.under_15": 16,
			"number_of_consultations.between_15_and_20.female": 32,
			"number_of_consultations.female.over_20": 64
		});
	});

	it('Sanitize should work on full model', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_doctors": 1,
				"number_of_consultations.male.under_15": 2,
				"number_of_consultations.between_15_and_20.male": 4,
				"number_of_consultations.male.over_20": 8,
				"number_of_consultations.female.under_15": 16,
				"number_of_consultations.between_15_and_20.female": 32,
				"number_of_consultations.female.over_20": 64
			}
		});

		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": 1,
			"number_of_consultations.male.under_15": 2,
			"number_of_consultations.between_15_and_20.male": 4,
			"number_of_consultations.male.over_20": 8,
			"number_of_consultations.female.under_15": 16,
			"number_of_consultations.between_15_and_20.female": 32,
			"number_of_consultations.female.over_20": 64
		});
	});

	it('Sanitize should drop useless data', function() {
		var input = new Input({
			period: "2010-01-04",
			form: "myForm",
			values: {
				"number_of_doctors": 1,
				"number_of_consultations.male.under_15": 2,
				"number_of_consultations.between_15_and_20.male": 4,
				"number_of_consultations.male.over_20": 8,
				"number_of_consultations.male.over_50": 8,
				"number_of_consultations.female.under_15": 16,
				"number_of_consultations.between_15_and_20.female": 32,
				"number_of_consultations.female.over_20": 64,
				"number_of_consultations.female.over_50": 8
			}
		});
		
		input.sanitize(form);

		expect(input.values).toEqual({
			"number_of_doctors": 1,
			"number_of_consultations.male.under_15": 2,
			"number_of_consultations.between_15_and_20.male": 4,
			"number_of_consultations.male.over_20": 8,
			"number_of_consultations.female.under_15": 16,
			"number_of_consultations.between_15_and_20.female": 32,
			"number_of_consultations.female.over_20": 64
		});
	});

});
