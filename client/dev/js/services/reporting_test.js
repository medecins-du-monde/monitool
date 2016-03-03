
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

