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

class ThemeStore extends Store {

	get modelString() { return 'theme'; }

	/**
	 * Retrieve all themes with their relative usage
	 */
	listWithUsage() {
		var promises = [
			this.list(),
			this._db.callView('themes_usage', {group: true})
		];

		return Promise.all(promises).then(function(result) {
			var themes = result[0], usage = result[1];

			themes.forEach(function(theme) {
				var projectUsage = usage.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'project'; }),
					indicatorUsage = usage.rows.filter(function(row) { return row.key[0] === theme._id && row.key[1] === 'indicator'; });

				theme.__projectUsage   = projectUsage.length ? projectUsage[0].value : 0;
				theme.__indicatorUsage = indicatorUsage.length ? indicatorUsage[0].value : 0;
			});

			return themes;
		});
	}
}

module.exports = ThemeStore;