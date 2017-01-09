"use strict";

var Store = require('../store'),
	Model = require('../model');

class AccessTokenStore extends Store {

	get modelClass() { return AccessToken; }
	get modelString() { return 'access-token'; }
}

var storeInstance = new AccessTokenStore();


class AccessToken extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = AccessToken;
