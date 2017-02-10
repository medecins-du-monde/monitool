"use strict";

var Store = require('./store');

class RefreshTokenStore extends Store {

	get modelString() { return 'refresh-token'; }

}

module.exports = RefreshTokenStore;

