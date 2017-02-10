"use strict";

var Model                  = require('./model'),
	AuthorizationCodeStore = require('../store/authorization-code');

var storeInstance = new AuthorizationCodeStore();


class AuthorizationCode extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = AuthorizationCode;
