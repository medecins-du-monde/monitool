"use strict";

var Model            = require('./model'),
	AccessTokenStore = require('../store/access-token');


var storeInstance = new AccessTokenStore();

class AccessToken extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = AccessToken;
