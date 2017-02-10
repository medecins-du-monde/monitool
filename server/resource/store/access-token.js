"use strict";

var Store = require('./store');

class AccessTokenStore extends Store {

	get modelString() { return 'access-token'; }

}

module.exports = AccessTokenStore;

