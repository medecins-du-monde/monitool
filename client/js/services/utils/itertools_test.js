
describe('itertools', function() {

	// Load service before each test.
	var itertools;
	beforeEach(module("monitool.services.utils.itertools"));
	beforeEach(inject(function(_itertools_) {
		itertools = _itertools_;
	}));

	it('should compute the product of 2 arrays', function() {
		var input = [[1, 2], [3, 4]],
			output = [[1, 3], [1, 4], [2, 3], [2, 4]];

		expect(itertools.product(input)).toEqual(output);
	});

	it('should compute the product of 3 arrays', function() {
		var input = [[1, 2], [3, 4], [5, 6]],
			output = [
			[1, 3, 5], [1, 3, 6],
			[1, 4, 5], [1, 4, 6],
			[2, 3, 5], [2, 3, 6],
			[2, 4, 5], [2, 4, 6]
		];

		expect(itertools.product(input)).toEqual(output);
	});
});
