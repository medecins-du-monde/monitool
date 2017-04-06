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

var nano     = require('nano'),
	config   = require('../../config'),
	database = require('../database');

/**
 * Represents a collection of models.
 * 
 * This is an abstract from which all stores inherit.
 */
class Store {

	get _db() {
		return database;
	}

	/**
	 * Get the name of this store.
	 *
	 * @type {Function}
	 */
	get modelClass() {
		return require('../model/' + this.modelString);
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
	list() {
		var view = 'by_type',
			opt = {include_docs: true, key: this.modelString},
			ModelClass = this.modelClass;

		return this._db.callView(view, opt).then(function(result) {
			return result.rows.map(row => new ModelClass(row.doc));
		});
	}

	/**
	 * Retrieve a given model
	 * 
	 * @return {Model}
	 */
	get(id) {
		return this._db.get(id).then(function(data) {
			return new this.modelClass(data);
		}.bind(this));
	}
}

module.exports = Store;
