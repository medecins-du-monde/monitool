"use strict";

var Store = require('../store'),
	Model = require('../model');

class ClientStore extends Store {

	get modelClass() { return Client; }
	get modelString() { return 'client'; }
}

var storeInstance = new ClientStore();


class Client extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = Client;
