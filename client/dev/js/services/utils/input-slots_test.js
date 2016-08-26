
describe('input-slots', function() {

	// Load service before each test.
	var inputSlots;
	beforeEach(module("monitool.services.utils.input-slots"));
	beforeEach(inject(function(_InputSlots_) {
		InputSlots = _InputSlots_;
	}));

	describe('minDate', function() {
		it('should work', function() {
			expect(InputSlots.minDate([
				new Date('2010-05-01'),
				new Date('2014-05-01'),
				new Date('2010-02-01')
			])).toEqual(new Date('2010-02-01'));
		});


		it('should work with null values', function() {
			expect(InputSlots.minDate([
				new Date('2010-05-01'),
				null,
				new Date('2010-02-01')
			])).toEqual(new Date('2010-02-01'));
		});
	});


	describe('getBegin', function() {
		it('should give the project begin', function() {

		});

		it('should give the entity begin 1', function() {
		
		});

		it('should give the entity begin 2', function() {
		
		});

		it('should give the entity begin 3', function() {
		
		});
	});

	describe('getSlots', function() {

	});

});
