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
	Client.storageInstance.get(id).then(
		function(client) { done(null, client); },
		function(error) { done(error); }
	);
});

//////////////////////////////////////////////
// Grants
//////////////////////////////////////////////

// Define grants (authorization code and access token).

var createAuthorizationCode = function(clientId, userId, redirectURI, done) {
	var authorizationCode = new AuthorizationCode({
		_id: uuid.v4(),
		type: 'authorization-code',
		clientId: clientId,
		userId: userId,
		redirectURI: redirectURI
	});

	authorizationCode.save().then(
		function() { done(null, authorizationCode._id); },
		function(error) { done(error); }
	);
};

var createAccessToken = function(clientId, userId, done) {
	var accessToken = new AccessToken({
		_id: uuid.v4(),
		type: 'access-token',
		clientId: clientId,
		userId: userId
	});

	accessToken.save().then(
		function() { done(null, authorizationCode._id); },
		function(error) { done(error); }
	);
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
	AuthorizationCode.storageInstance.get(code).then(
		function(authorizationCode) {
			if (authorizationCode.clientId !== client._id || authorizationCode.redirectURI !== redirectURI)
				return done(null, false);

			createAccessToken(authorizationCode.clientId, authorizationCode.userId, done);
		},
		function(error) {
			done(error);
		}
	);
}));

module.exports = server;
