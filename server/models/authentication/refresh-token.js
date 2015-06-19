"use strict";

var Abstract  = require('../abstract');

module.exports = {
	list: Abstract.list.bind(this, 'refresh-token'),
	get: Abstract.get.bind(this, 'refresh-token'),
	delete: Abstract.delete.bind(this, 'refresh-token'),
	set: Abstract.set.bind(this),

};
