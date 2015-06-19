"use strict";

var Abstract  = require('../abstract');

module.exports = {
	list: Abstract.list.bind(this, 'client'),
	get: Abstract.get.bind(this, 'client'),
	delete: Abstract.delete.bind(this, 'client'),
	set: Abstract.set.bind(this),

};
