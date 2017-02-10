"use strict";

var validator = require('is-my-json-valid'),
	UserStore = require('../store/user'),
	Model = require('./model'),
	schema = require('../schema/user.json');

var validate = validator(schema),
	storeInstance = new UserStore();

class User extends Model {

	static get storeInstance() { return storeInstance; }

	/**
	 * Deserialize and validate POJO
	 */
	constructor(data) {
		super(data, validate);
	}
}

module.exports = User;
