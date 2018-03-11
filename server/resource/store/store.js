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

import nano from 'nano';
import config from '../../config';
import database from '../database';

/**
 * Represents a collection of models.
 *
 * This is an abstract from which all stores inherit.
 */
export default class Store {

	get _db() {
		return database;
	}

	/**
	 * Get the name of this store.
	 *
	 * @type {Function}
	 */
	get modelClass() {
		throw new Error('modelClass must be overriden');
	}

	/**
	 * Get the name of this store
	 *
	 * @abstract
	 * @type {string}
	 */
	get modelString() {
		throw new Error('modelString must be overriden');
	}

	/**
	 * Retrieve all models of current type.
	 *
	 * @return {Array.<Model>}
	 */
	async list() {
		const viewResult = await this._db.callView(
			'by_type',
			{include_docs: true, key: this.modelString}
		);

		return viewResult.rows.map(row => new this.modelClass(row.doc));
	}

	/**
	 * Retrieve a given model
	 *
	 * @return {Model}
	 */
	async get(id) {
		return new this.modelClass(await this._db.get(id))
	}
}
