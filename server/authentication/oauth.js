"use strict";

var uuid              = require('node-uuid'),
	oauth2orize       = require('oauth2orize'),
	Client            = require('../models/authentication/client'),
	AccessToken       = require('../models/authentication/access-token'),
	AuthorizationCode = require('../models/authentication/authorization-code');

var server = oauth2orize.createServer();

//////////////////////////////////////////////
// User serialization
//////////////////////////////////////////////

server.serializeClient(function(client, done) {
	return done(null, client._id);
});

server.deserializeClient(function(id, done) {
	Client.get(id, function(error, client) {
		if (error)
			return done(error);

		return done(null, client);
	});
});

//////////////////////////////////////////////
// Grants
//////////////////////////////////////////////

// Define grants (authorization code and access token).

var createAuthorizationCode = function(clientId, userId, redirectURI, done) {
	var authorizationCode = {
		_id: uuid.v4(),
		type: 'authorization-code',
		clientId: clientId,
		userId: userId,
		redirectURI: redirectURI
	};

	AuthorizationCode.set(authorizationCode, function(error) {
		if (error)
			return done(error);

		done(null, authorizationCode._id);
	});
};

var createAccessToken = function(clientId, userId, done) {
	var accessToken = {
		_id: uuid.v4(),
		type: 'access-token',
		clientId: clientId,
		userId: userId
	};

	AccessToken.set(accessToken, function(error) {
		if (error)
			return done(error);

		done(null, accessToken._id);
	});
};

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
	createAuthorizationCode(client._id, user._id, redirectURI, done);
}));

server.grant(oauth2orize.grant.token(function(client, user, ares, done) {
	createAccessToken(client._id, user._id, done);
}));


//////////////////////////////////////////////
// Exchanges
//////////////////////////////////////////////

// Define exchanges (we only allow authorization code to access token).

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
	AuthorizationCode.get(code, function(error, authorizationCode) {
		if (error)
			return done(error);

		if (authorizationCode.clientId !== client._id || authorizationCode.redirectURI !== redirectURI)
			return done(null, false);

		createAccessToken(authorizationCode.clientId, authorizationCode.userId, done);
	});
}));

module.exports = server;
