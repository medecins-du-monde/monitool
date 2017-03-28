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
