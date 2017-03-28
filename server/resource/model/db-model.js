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

var nano      = require('nano'),
	Model     = require('./model'),
	config    = require('../../config'),
	database  = nano(config.couchdb.url).use(config.couchdb.bucket);

class DbModel extends Model {


	/**
	 * Delete the model from the database.
	 * No checks are performed to ensure that database integrity is not lost!
	 */
	destroy() {
		return new Promise(function(resolve, reject) {
			database.destroy(this._id, this._rev, function(error) {
				if (error)
					reject(error);
				else
					resolve();
			}.bind(this));
		}.bind(this));
	}

	/**
	 * Validate that all foreign keys in this model are valid in current database.
	 * Child classes must override this method when relevant.
	 */
	validateForeignKeys() {
		return Promise.resolve();
	}

	/**
	 * Save model in database after checking that foreign keys are valid.
	 */
	save(skipChecks) {
		var canSave = skipChecks ? Promise.resolve() : this.validateForeignKeys();

		return canSave.then(function() {
			return new Promise(function(resolve, reject)  {
				database.insert(this, function(error, result) {
					if (error)
						reject(error)
					else {
						this._rev = result.rev;
						resolve(this);
					}
				}.bind(this));
			}.bind(this));
		}.bind(this));
	}

}

module.exports = DbModel;
