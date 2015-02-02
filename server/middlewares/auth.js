"use strict";

var auth   = require('basic-auth'),
	crypto = require('crypto'),
	User   = require('../models/user');

module.exports = function(request, response, next) {
	var credentials = auth(request);
	if (!credentials) {
		if (!request.get('X-NoBasicAuth'))
			response.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		
		return response.status(401).json({error: true, message: "Please Authenticate"});
	}

	User.get(credentials.name, function(error, user) {
		if (error)
			return response.status(403).json({error: true, message: "Wrong username"});
		else {
			var shasum = crypto.createHash('sha1'),
				hash   = shasum.update(user.salt + credentials.pass);

			if (shasum.digest('hex') !== user.hash)
				return response.status(403).json({error: true, message: "Wrong password"});

			request.user = user;
			next();
		}
	});
};
