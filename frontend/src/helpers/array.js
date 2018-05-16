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


/**
 * Compute the product of two arrays.
 *
 * @example
 * product([1], [2, 3]) // [[1, 2], [1, 3]]
 */
export function productSingle(a, b) {
	var result = [], lengthA = a.length, lengthB = b.length;
	var k = 0;

	for (var i = 0; i < lengthA; ++i)
		for (var j = 0; j < lengthB; ++j)
			result[k++] = [...a[i], b[j]];

	return result;
};

/**
 * Compute the product of multiple arrays.
 *
 * @example
 * product([[1, 2], [3, 4]]) // [[1, 3], [1, 4], [2, 3], [2, 4]]
 * product([[1], [3, 4, 5]]) // [[1, 3], [1, 4], [1, 5]]
 */
export function product(list) {
	if (list.length == 0)
		return [];

	var memo = list[0].map(el => [el]);
	for (var i = 1; i < list.length; ++i)
		memo = productSingle(memo, list[i]);

	return memo;
};



/**
 * Compute a range. End value is not included.
 *
 * @example
 * > range(10, 20)
 * [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
 */
export function range(start, end) {
	var integerRange = [];
	for (var i = start; i < end; ++i)
		integerRange.push(i);
	return integerRange;
};

