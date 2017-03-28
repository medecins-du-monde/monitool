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

"use strict";

class Model {

	/**
	 * Construct model from POJO
	 * A first validation step will happen here to ensure that the POJO is properly formatted.
	 */
	constructor(data, validate) {
		if (validate) {
			if (!data)
				throw new Error('missing_data');

			validate(data);
			var errors = validate.errors || [];
			if (errors.length) {
				var error = new Error('invalid_data');
				error.detail = errors;
				error.model = data;
				throw error;
			}
		}

		Object.assign(this, data);
	}

	/**
	 * Compute API version of this model. This is useful to hide some fields if needed (=> passwords)
	 * Override it on child classes when needed.
	 */
	toAPI() {
		return this;
	}

}

module.exports = Model;
