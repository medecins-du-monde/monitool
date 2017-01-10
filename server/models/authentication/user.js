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
		return this._callView('partners', {key: username}).then(function(data) {
			if (data.rows.length == 0)
				throw new Error('not_found');

			return data.rows[0].value;
		});
	}
	
}

var storeInstance = new UserStore();

class User extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate a project that comes from the API.
	 */
	constructor(data) {
		super(data, validate);
	}
}

module.exports = User;
