"use strict";

var Model             = require('./model'),
	RefreshTokenStore = require('../store/refresh-token');

var storeInstance = new RefreshTokenStore();

class RefreshToken extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = RefreshToken;
