
describe('mtReporting', function() {

	// Load service before each test.
	var mtReporting;
	beforeEach(module("monitool.services.reporting"));
	beforeEach(inject(function(_mtReporting_) {
		mtReporting = _mtReporting_;
	}));

	it('should aggregate numbers properly', function() {
		expect(mtReporting._aggregateValues("none", [1, 2, 3])).toEqual('CANNOT_AGGREGATE');
		expect(mtReporting._aggregateValues("sum", [1, 2, 3])).toEqual(6);
		expect(mtReporting._aggregateValues("average", [1, 2, 3])).toEqual(2);
		expect(mtReporting._aggregateValues("highest", [1, 2, 3])).toEqual(3);
		expect(mtReporting._aggregateValues("lowest", [1, 2, 3])).toEqual(1);
		expect(mtReporting._aggregateValues("last", [1, 2, 3])).toEqual(3);
		expect(mtReporting._aggregateValues("sum", ["HELLO", 2, 3])).toEqual('HELLO');
	});

	it('should be able to group multiple inputs following rules from a form', function() {
		var form = Form({
			id: "myForm",
			sections: [
				{
					id: "section1",

				}
			]
			
		});

		var input1 = Input({
			period: "2010-01-02",
			form: "myForm",
			values: {

			}
		});

		var input2 = Input({
			period: "2010-01-03",
			form: "myForm",
			values: {

			}
		});

	});


});


