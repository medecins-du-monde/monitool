"use strict";

var validator = require('is-my-json-valid'),
	Store = require('../store'),
	Model = require('../model'),
	schema = require('./user.json');

var validate = validator(schema);


class UserStore extends Store {

	get modelClass() { return User; }
	get modelString() { return 'user'; }

	getPartner(username) {
		return new Promise(function(resolve, reject) {
			database.view('shortlists', 'partners', {key: username}, function(error, data) {
				if (error)
					return reject('db_fail');

				if (data.rows.length == 0)
					return reject('not_found');

				resolve(data.rows[0].value);
			});
		})
	}

}

var storeInstance = new UserStore();

class User extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from the API.
	 */
	constructor(data) {
		validate(data);
		var errors = validate.errors || [];
		if (errors.length)
			throw new Error('invalid_data');

		super(data);
	}
}

module.exports = User;
