"use strict";

var Store = require('./store');

class ClientStore extends Store {

	get modelString() { return 'client'; }

}

module.exports = ClientStore;
