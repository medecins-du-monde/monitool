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


Math.factorial = function(num) {
	var rval = 1;
	for (var i = 2; i <= num; i++)
		rval = rval * i;

	return rval;
};

Math.mod = function(a, b) {
	return (a % b) % b;
};

Number.isNaN = Number.isNaN || function(value) {
 	return typeof value === "number" && isNaN(value);
};

