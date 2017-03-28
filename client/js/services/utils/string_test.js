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


describe('mtRemoveDiacritics', function() {

	// Load service before each test.
	var mtRemoveDiacritics;
	beforeEach(module("monitool.services.utils.string"));
	beforeEach(inject(function(_mtRemoveDiacritics_) {
		mtRemoveDiacritics = _mtRemoveDiacritics_;
	}));

	it('should remove special chars and accents', function() {
		expect(mtRemoveDiacritics("éçóôä")).toEqual("ecooa");
	});

});
