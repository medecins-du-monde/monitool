
describe('mtRemoveDiacritics', function() {

	// Load service before each test.
	var mtRemoveDiacritics;
	beforeEach(module("monitool.services.string"));
	beforeEach(inject(function(_mtRemoveDiacritics_) {
		mtRemoveDiacritics = _mtRemoveDiacritics_;
	}));

	it('should remove special chars and accents', function() {
		expect(mtRemoveDiacritics("éçóôä")).toEqual("ecooa");
	});

});
