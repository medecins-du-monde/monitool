
describe('Olap', function() {

	// Load service before each test.
	var Cube, CompoundCube, Dimension, DimensionGroup;
	beforeEach(module('monitool.services.statistics.olap'));
	beforeEach(inject(function(_Cube_, _CompoundCube_, _Dimension_, _DimensionGroup_) {
		Cube = _Cube_;
		CompoundCube = _CompoundCube_;
		Dimension = _Dimension_;
		DimensionGroup = _DimensionGroup_;
	}));

	var cube;

	// Define test cube (a very small one!)
	beforeEach(function() {
		cube = new Cube(
			'num_consultations',
			[
				new Dimension('gender', ['male', 'female'], 'sum'),
				new Dimension('place', ['paris', 'madrid', 'london'], 'sum'),
				new Dimension('age', ['minor', 'major'], 'sum'),
				new Dimension('pathology', ['hiv', 'other'], 'sum')
			],
			[
				new DimensionGroup(
					'continent', 'place',
					{
						europe: ['paris', 'madrid', 'london'],
						continental_europe: ['paris', 'madrid'],
						islandic_europe: ['london']
					}
				)
			],
			[
				1,  // male    paris   minor  hiv
				2,  // male    paris   minor  other
				3,  // male    paris   major  hiv
				4,  // male    paris   major  other
				5,  // male    madrid  minor  hiv
				6,  // male    madrid  minor  other
				7,  // male    madrid  major  hiv
				8,  // male    madrid  major  other
				9,  // male    london  minor  hiv
				10, // male    london  minor  other
				11, // male    london  major  hiv
				12, // male    london  major  other
				13, // female  paris   minor  hiv
				14, // female  paris   minor  other
				15, // female  paris   major  hiv
				16, // female  paris   major  other
				17, // female  madrid  minor  hiv
				18, // female  madrid  minor  other
				19, // female  madrid  major  hiv
				20, // female  madrid  major  other
				21, // female  london  minor  hiv
				22, // female  london  minor  other
				23, // female  london  major  hiv
				24  // female  london  major  other
			]
		);
	});

	describe("Build stage", function() {

		it('should create a time Dimension from project', function() {

		});

		it('should create a time Dimension from inputs', function() {

		});

		it('should create a location Dimension from project', function() {

		});

		it('should create a location Dimension from form', function() {

		});

		it('should create a partition Dimension', function() {

		});

		it('should create a time DimensionGroup', function() {
			var days = new Dimension('day', ['2010-01-01', '2010-01-02', '2010-01-03'], 'sum');
			var months = DimensionGroup.createTime('month', days);

			expect(months.mapping).toEqual({'2010-01': ['2010-01-01', '2010-01-02', '2010-01-03']});
		})

		it('should create a time DimensionGroup', function() {
			var days = new Dimension('week', ['2010-W01', '2010-W31', '2011-W09'], 'sum');
			var quarters = DimensionGroup.createTime('quarter', days);

			expect(quarters.mapping).toEqual({
				'2010-Q1': ['2010-W01'],
				'2010-Q3': ['2010-W31'],
				'2011-Q1': ['2011-W09']
			});
		});

		it('should create a location DimensionGroup', function() {
			// simple case
		});

		it('should create a location DimensionGroup', function() {
			// empty / fail / etc
		});

	});


	describe("Simple queries", function() {

		it('should sum all cube', function() {
			var sum = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24;

			expect(cube.query([], {})).toEqual(sum);
			expect(cube.query([], {gender: ["male", "female"]})).toEqual(sum);
		});

		it('should filter on one field', function() {
			expect(cube.query([], {gender: ["female"]})).toEqual(13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24);
		});

		it('should filter on two fields, 1 value each', function() {
			expect(cube.query([], {gender: ["male"], place: ['paris']})).toEqual(1 + 2 + 3 + 4);
		});

		it('should split by gender', function() {
			expect(cube.query(['gender'], {})).toEqual({
				male: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12,
				female: 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24
			})
		});

		it('should split by gender and age', function() {
			expect(cube.query(['gender', 'age'], {})).toEqual({
				male: {'minor': 1 + 2 + 5 + 6 + 9 + 10, 'major': 3 + 4 + 7 + 8 + 11 + 12},
				female: {'minor': 13 + 14 + 17 + 18 + 21 + 22, 'major': 23 + 15 + 16 + 19 + 20 + 24}
			});
		});

		it('should split by gender and age and filter', function() {
			expect(cube.query(['gender', 'age'], {pathology: ["other"]})).toEqual({
				male: {
					minor: 2 + 6 + 10,
					major: 4 + 8 + 12
				},
				female: {
					minor: 14 + 18 + 22,
					major: 16 + 20 + 24
				}
			});
		});

		it('should work when filtering by groups', function() {
			expect(cube.query([], {continent: ['europe']})).toEqual(
				1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24
			);
		});

		it('should work when filtering by overlaping groups', function() {
			expect(cube.query([], {continent: ['europe', 'continental_europe']})).toEqual(
				1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24
			);
		});

		it('should work when grouping by overlaping group', function() {
			expect(cube.query(['continent'], {})).toEqual({
				europe: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21 + 22 + 23 + 24,
				continental_europe: 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20,
				islandic_europe: 9 + 10 + 11 + 12 + 21 + 22 + 23 + 24
			});
		});
	});

	


});


