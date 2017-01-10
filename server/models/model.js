"use strict";

var nano      = require('nano'),
	config    = require('../../config'),
	database  = nano(config.couchdb.url).use(config.couchdb.bucket);

class Model {

	constructor(data, validate) {
		if (validate) {
			if (!data)
				throw new Error('missing_data');
			
			validate(data);
			var errors = validate.errors || [];
			if (errors.length) {
				var error = new Error('invalid_data');
				error.detail = errors;
				error.model = data;
				throw error;
			}
		}

		Object.assign(this, data);
	}

	get storeInstance() {
		throw new Error('Override me');
	}

	destroy() {
		return new Promise(function(resolve, reject) {
			database.destroy(this._id, this._rev, function(error) {
				if (error)
					reject(error);
				else
					resolve();
			})
		});
	}

	save() {
		return new Promise(function(resolve, reject)  {
			database.insert(this, function(error, result) {
				if (error)
					reject(error)
				else
					return resolve(result);
			});
		});
	}

	toAPI() {
		return this;
	}

}

module.exports = Model;
