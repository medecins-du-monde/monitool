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

import Model from './model';
import database from '../database';

export default class DbModel extends Model {

	get _db() {
		return database;
	}

	/**
	 * Delete the model from the database.
	 * No checks are performed to ensure that database integrity is not lost!
	 */
	async destroy() {
		return this._db.destroy(this._id, this._rev);
	}

	/**
	 * Validate that all foreign keys in this model are valid in current database.
	 * Child classes must override this method when relevant.
	 */
	async validateForeignKeys() {
	}

	/**
	 * Save model in database after checking that foreign keys are valid.
	 */
	async save(skipChecks) {
		if (!skipChecks)
			await this.validateForeignKeys();

		return this._db.insert(this);
	}

}
