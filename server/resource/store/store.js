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
	database = nano(config.couchdb.url).use(config.couchdb.bucket);

/**
 * Represents a collection of models.
 * 
 * This is an abstract from which all stores inherit.
 */
class Store {

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
	 * Create a new store
	 */
	constructor() {
		this._db = database;
	}

	/**
	 * Wrap view queries to database into a promise
	 * 
	 * @protected
	 * @param  {string} viewName
	 * @param  {Object} options
	 * @return {Array}
	 */
	_callView(viewName, options) {
		return new Promise(function(resolve, reject) {
			this._db.view('monitool', viewName, options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
	}

	/**
	 * Wrap list queries to database into a promise
	 * 
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	_callList(options) {
		return new Promise(function(resolve, reject) {
			this._db.list(options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
	}

	/**
	 * Wrap bulk queries to database into a promise
	 * 
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	_callBulk(options) {
		return new Promise(function(resolve, reject) {
			this._db.bulk(options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
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

		return this._callView(view, opt).then(function(result) {
			return result.rows.map(row => new ModelClass(row.doc));
		});
	}

	/**
	 * Retrieve a given model
	 * 
	 * @return {Model}
	 */
	get(id) {
		return new Promise(function(resolve, reject) {
			this._db.get(id, function(error, data) {
				if (error)
					reject(error);

				else if (data.type !== this.modelString)
					reject(new Error('wrong_type'));

				else {
					try {
						resolve(new this.modelClass(data));
					}
					catch (e) {
						reject(e.message);
					}
				}
				
			}.bind(this));
		}.bind(this));
	}
}

module.exports = Store;
