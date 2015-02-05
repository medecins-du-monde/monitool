"use strict";

var nano = require('nano'),
	config = require('../config.json');

module.exports = nano(config.couchdb.url).use(config.couchdb.bucket);
