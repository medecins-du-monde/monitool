"use strict";

var Store = require('./store');

class AuthorizationCodeStore extends Store {

	get modelString() { return 'authorization-code'; }

}

module.exports = AuthorizationCodeStore;