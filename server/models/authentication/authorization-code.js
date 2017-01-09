"use strict";

var Store = require('../store'),
	Model = require('../model');

class AuthorizationCodeStore extends Store {

	get modelClass() { return AuthorizationCode; }
	get modelString() { return 'authorization-code'; }
}

var storeInstance = new AuthorizationCodeStore();


class AuthorizationCode extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = AuthorizationCode;
