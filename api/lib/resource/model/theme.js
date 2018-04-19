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

import validator from 'is-my-json-valid';
import ThemeStore from '../store/theme';
import DbModel from './db-model';
import schema from '../schema/theme.json';

import Project from './project';
import Indicator from './indicator';


var validate = validator(schema),
	storeInstance = new ThemeStore();

export default class Theme extends DbModel {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a theme
	 */
	constructor(data) {
		super(data, validate);
	}

	/**
	 * Delete the theme from the database.
	 * This method also updates all indicators and projects that used the theme and related cross-cutting indicators.
	 */
	async destroy() {
		let [projects, indicators] = await Promise.all([
			Project.storeInstance.listByTheme(this._id),
			Indicator.storeInstance.listByTheme(this._id)
		]);

		// Delete outself
		this._deleted = true;

		indicators.forEach(function(indicator) {
			// Remove ourself from indicator.
			indicator.themes = indicator.themes.filter(t => t !== this._id);
		}, this);

		projects.forEach(function(project) {
			// Remove ourself from project
			project.themes = project.themes.filter(t => t !== this._id);

			// Check if the crossCutting indicators in the projects are still relevant
			for (var indicatorId in project.crossCutting) {
				var indicator = indicators.find(i => i._id === indicatorId);

				// if the indicator is not in the list we just fetched, it won't be touched
				// by the removal of the thematic (the indicator did not have it from the beginning, so
				// it must be collected for another reason).
				if (indicator) {
					// if the intersection of themes between project and indicator have become empty
					// because of removing ourself, we have to delete the indicator from the project.
					var intersection = project.themes.filter(themeId => indicator.themes.indexOf(themeId) !== -1);
					if (intersection.length === 0)
						delete project.crossCutting[indicatorId];
				}
			}
		}, this);

		let bulkResults = await this._db.callBulk({docs: [this, ...indicators, ...projects]});

		// bulk updates don't give us the whole document
		var themeResult = bulkResults.find(res => res.id === this._id);
		if (themeResult.error)
			throw new Error(themeResult.error);
	}
}

