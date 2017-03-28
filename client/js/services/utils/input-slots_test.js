/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */


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
