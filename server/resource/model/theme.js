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

var validator  = require('is-my-json-valid'),
	ThemeStore = require('../store/theme'),
	DbModel    = require('./db-model'),
	schema     = require('../schema/theme.json');

var validate = validator(schema),
	storeInstance = new ThemeStore();

class Theme extends DbModel {

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
	destroy() {
		var Project = require('./project'), Indicator = require('./indicator'); // circular import...
		var promises = [Project.storeInstance.listByTheme(this._id), Indicator.storeInstance.listByTheme(this._id)];
		
		return Promise.all(promises)
			.then(function(res) {
				var projects = res[0], indicators = res[1];

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

				return this._db.callBulk({docs: indicators.concat(projects).concat([this])});
			}.bind(this))
			
			.then(function(bulkResults) {
				// bulk updates don't give us the whole document
				var themeResult = bulkResults.find(res => res.id === this._id);
				if (themeResult.error)
					throw new Error(themeResult.error);

			}.bind(this));
	}

}

module.exports = Theme;

