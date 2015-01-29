"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/user');

var validate = validator(schema);

module.exports = {
	list: Abstract.list.bind(this, 'user'),
	get: Abstract.get.bind(this, 'user'),
	delete: Abstract.delete.bind(this, 'user'),
	set: Abstract.set.bind(this),

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		return callback(errors.length ? errors : null);
	},

};
