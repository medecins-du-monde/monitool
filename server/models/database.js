"use strict";

var nano   = require('nano'),
	config = require('../../config');

module.exports = nano(config.couchdb.url).use(config.couchdb.bucket);
