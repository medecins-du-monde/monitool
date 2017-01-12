"use strict";

var nano      = require('nano'),
	config    = require('../../config'),
	database  = nano(config.couchdb.url).use(config.couchdb.bucket);

class Model {

	/**
	 * Construct model from POJO
	 * A first validation step will happen here to ensure that the POJO is properly formatted.
	 */
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

	/**
	 * Compute API version of this model. This is useful to hide some fields if needed (=> passwords)
	 * Override it on child classes when needed.
	 */
	toAPI() {
		return this;
	}

}

module.exports = Model;
