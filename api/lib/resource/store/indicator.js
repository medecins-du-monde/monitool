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


import Store from './store';
import Indicator from '../model/indicator';

export default class IndicatorStore extends Store {

	get modelString() {
		return 'indicator';
	}

	get modelClass() {
		return Indicator;
	}

	/**
	 * Retrieve all indicators that are associated with a given theme
	 * This is used to update the indicators when deleting a theme
	 */
	async listByTheme(themeId) {
		if (typeof themeId !== 'string')
			throw new Error("missing_parameter");

		const result = await this._db.callView('indicator_by_theme', {key: themeId, include_docs: true});

		return result.rows.map(row => new Indicator(row.doc));
	}
}
