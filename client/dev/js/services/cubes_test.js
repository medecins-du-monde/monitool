
describe('Olap', function() {

	// Load service before each test.
	var Olap;
	beforeEach(module('monitool.services.olap'));
	beforeEach(inject(function(_Olap_) {
		Olap = _Olap_;
	}));


	var cube;

	// Define test cube (a very small one!)
	beforeEach(function() {
		cube = new Olap.Cube(
			'num_consultations',
			[
				new Olap.Dimension('gender', ['male', 'female', 'transgenre'], 'sum'),
				new Olap.Dimension('place', ['paris', 'madrid', 'london', 'rome'], 'sum'),
				new Olap.Dimension('age', ['-15', '+15-18', '+18'], 'sum'),
				new Olap.Dimension('pathology', ['hiv', 'hbv', 'other'], 'sum')
			],
			[
				new Olap.ElementaryCube({gender: 'male', place: 'paris',  age: '-15', pathology: 'other'}, 1),
				new Olap.ElementaryCube({gender: 'female', place: 'london', age: '+18', pathology: 'hiv'}, 4),
				new Olap.ElementaryCube({gender: 'male', place: 'madrid', age: '+18', pathology: 'other'}, 2),
				new Olap.ElementaryCube({gender: 'female', place: 'rome',   age: '+18', pathology: 'other'}, 8)
			]
		);
	});

	it('should sum all cube', function() {
		expect(cube.query()).toEqual(15);
	});

	it('should filter on one field', function() {
		expect(cube.query(null, {gender: ["female"]})).toEqual(12);
	});

	it('should filter on one field, 2 values', function() {
		expect(cube.query(null, {gender: ["male", "female"]})).toEqual(15);
	});

	it('should filter on two fields, 1 value each', function() {
		expect(cube.query(null, {gender: ["male"], place: ['paris']})).toEqual(1);
	});

	it('should split by gender', function() {
		expect(cube.query(['gender'])).toEqual({male: 3, female: 12, transgenre: 0})
	});

	it('should split by gender and age', function() {
		expect(cube.query(['gender', 'age'])).toEqual({
			male: {'-15': 1, '+15-18': 0, '+18': 2},
			female: {'-15': 0, '+15-18': 0, '+18': 12},
			transgenre: {'-15': 0, '+15-18': 0, '+18': 0}
		});
	});

	it('should split by gender and age and filter', function() {
		expect(cube.query(['gender', 'age'], {pathology: "other"})).toEqual({
			male: {'-15': 1, '+15-18': 0, '+18': 2},
			female: {'-15': 0, '+15-18': 0, '+18': 8},
			transgenre: {'-15': 0, '+15-18': 0, '+18': 0}
		});
	});

});
