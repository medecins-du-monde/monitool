"use strict";

var Abstract  = require('../abstract');

module.exports = {
	list: Abstract.list.bind(this, 'authorization-code'),
	get: Abstract.get.bind(this, 'authorization-code'),
	delete: Abstract.delete.bind(this, 'authorization-code'),
	set: Abstract.set.bind(this),

};
