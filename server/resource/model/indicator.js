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

var validator      = require('is-my-json-valid'),
	DbModel        = require('./db-model'),
	IndicatorStore = require('../store/indicator'),
	Theme          = require('./theme'),
	schema         = require('../schema/indicator.json');


var validate = validator(schema),
	storeInstance = new IndicatorStore();

class Indicator extends DbModel {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a indicator that comes from either API or Database.
	 */
	constructor(data) {
		super(data, validate);
	}

	/**
	 * Validate that indicator does not make references to themes that don't exist
	 */
	validateForeignKeys() {
		// If no themes are defined, early quit
		if (this.themes.length === 0)
			return Promise.resolve();

		// Otherwise we just fetch all themes and check.
		return Theme.storeInstance.list().then(function(themes) {
			this.themes.forEach(function(themeId) {
				if (themes.filter(t => t._id === themeId).length === 0)
					throw new Error('invalid_reference');
			}.bind(this));
		}.bind(this));
	}

	/**
	 * Delete indicator and updates all projects that are using it.
	 */
	destroy() {
		var Project = require('./project'); // circular import...

		return Project.storeInstance.listByIndicator(this._id, false).then(function(projects) {
			// Delete cross cutting indicator from projects.
			projects.forEach(function(project) {
				delete project.crossCutting[this._id];
			}, this);

			// Mark ourself as deleted
			this._deleted = true;

			// Save everything in on request
			return Indicator.storeInstance._callBulk({docs: projects.concat([this])});
		}.bind(this)).then(function() { /* do not pass couchdb result to caller */ });
	}
}

module.exports = Indicator;
