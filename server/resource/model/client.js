"use strict";

var Model       = require('./model'),
	ClientStore = require('../store/client');

var storeInstance = new ClientStore();


class Client extends Model {

	static get storeInstance() { return storeInstance; }

	constructor(data) {
		super(data);
	}
}

module.exports = Client;
