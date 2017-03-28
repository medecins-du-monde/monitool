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

var Store = require('./store');

class IndicatorStore extends Store {

	get modelString() { return 'indicator'; }


	/**
	 * Retrieve all indicators that are associated with a given theme
	 * This is used to update the indicators when deleting a theme
	 */
	listByTheme(themeId) {
		if (typeof themeId !== 'string')
			return Promise.reject(new Error("missing_parameter"));

		var view = 'indicator_by_theme', opt = {key: themeId, include_docs: true},
			Indicator = this.modelClass;
		
		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new Indicator(row.doc));
		});
	}
}

module.exports = IndicatorStore;
