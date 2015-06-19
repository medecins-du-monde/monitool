"use strict";

var Abstract  = require('../abstract');

module.exports = {
	list: Abstract.list.bind(this, 'access-token'),
	get: Abstract.get.bind(this, 'access-token'),
	delete: Abstract.delete.bind(this, 'access-token'),
	set: Abstract.set.bind(this),

};
