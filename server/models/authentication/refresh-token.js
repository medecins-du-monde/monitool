"use strict";

var Store = require('../store'),
	Model = require('../model');

class RefreshTokenStore extends Store {

	get modelClass() { return RefreshToken; }
	get modelString() { return 'refresh-token'; }
}

var storeInstance = new RefreshTokenStore();


class RefreshToken extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = RefreshToken;
