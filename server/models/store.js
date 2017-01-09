"use strict";

var nano     = require('nano'),
	config   = require('../../config'),
	database = nano(config.couchdb.url).use(config.couchdb.bucket);

class Store {

	get modelClass() { throw new Error('modelClass'); }
	get modelString() { throw new Error('modelString'); }
	
	constructor() {
		this._db = database;
	}

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
	 * Retrieve all models
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
	 */
	get(id) {
		return new Promise(function(resolve, reject) {
			this._db.get(id, function(error, data) {
				if (error)
					return reject('not_found');

				if (data.type !== this.modelString)
					return reject('wrong_type');

				try { resolve(new this.modelClass(data)); }
				catch (e) { reject(e.message); }
				
			}.bind(this));
		}.bind(this));
	}
}

module.exports = Store;
