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

describe('shared filters', function() {

	var $filter;

	beforeEach(module('monitool.filters.shared'));
	beforeEach(inject(function(_$filter_){
		$filter = _$filter_;
	}));

	it('join should work', function() {
		var join = $filter('join');

		expect(join(['a', 'b'], '')).toEqual('ab');
		expect(join(['a', 'b'], ',')).toEqual('a,b');
	});

	it('pluck should work', function() {
		var pluck = $filter('pluck');

		expect(pluck([{id: 3}], 'id')).toEqual([3]);
		expect(pluck([], 'id')).toEqual([]);
		expect(pluck([{}], 'id')).toEqual(['']);
	});

	it('getObjects should work', function() {
		var getObjects = $filter('getObjects');
		
		expect(getObjects([3], [{id: 3}, {id: 4}])).toEqual([{id: 3}]);
	});

	it('nl2br should work', function() {
		var nl2br = $filter('nl2br');

		expect(nl2br("\n")).toEqual('<br/>');
		expect(nl2br("\nabc\n")).toEqual('<br/>abc<br/>');
		expect(nl2br("\n\nabc\n")).toEqual('<br/><br/>abc<br/>');
	});

});
