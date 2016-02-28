"use strict";

var passport               = require('passport'),
	BasicStrategy          = require('passport-http').BasicStrategy,
	BearerStrategy         = require('passport-http-bearer').Strategy,
	LocalStrategy          = require('passport-local').Strategy,
	OAuth2Strategy         = require('passport-oauth2'),
	ClientPasswordStrategy = require('passport-oauth2-client-password'),
	User                   = require('../models/authentication/user'),
	Client                 = require('../models/authentication/client'),
	AccessToken            = require('../models/authentication/access-token'),
	config                 = require('../../config');

var database = require('../models/database');

/////////////////////////////////////////////////////////////////////////////
// User serialization
/////////////////////////////////////////////////////////////////////////////

passport.serializeUser(function(user, done) {
	if (user.type == 'user')
		done(null, user._id);

	else if (user.type === 'partner')
		done(null, 'partner:' + user.username);

	// clients are not allowed to have sessions, so this should never be called.
	// let's make sure of that
	else
		throw new Error('Clients cannot have sessions. Use bearer token or basic auth');

});

passport.deserializeUser(function(id, done) {
	var type = id.substring(0, id.indexOf(':'));

	if (type === 'usr') {
		User.get(id, function(error, user) {
			done(error, user);
		});
	}
	else if (type === 'partner') {
		database.view('shortlists', 'partners', {key: id.substring('partner:'.length)}, function(error, data) {
			if (error)
				return done('db_fail');

			if (data.rows.length == 0)
				return done('partner_not_found');

			done(null, data.rows[0].value)
		});
	}
	else
		throw new Error('Clients cannot have sessions.');
});


/////////////////////////////////////////////////////////////////////////////
// User log in with Microsoft Azure Active Directory
/////////////////////////////////////////////////////////////////////////////

var strategy = new OAuth2Strategy(
	{
		authorizationURL: config.oauth.authUrl,
		tokenURL: config.oauth.tokenUrl,
		clientID: config.oauth.clientId,
		clientSecret: config.oauth.clientSecret,
		callbackURL: config.oauth.callbackUrl
	},
	// This method is invoked upon auth sequence completion
	// Its the hook to cache the access/refresh tokens, post-process the Azure profile, etc.
	function (accessToken, refreshToken, profile, done) {
		try {
			var userId = 'usr:' + profile.unique_name.substring(0, profile.unique_name.indexOf('@')),
				domain = profile.unique_name.substring(profile.unique_name.lastIndexOf('@') + 1);

			if (domain !== 'medecinsdumonde.net')
				return done(
					"You must use an account from medecinsdumonde.net (not " + domain + ").\n" +
					"Try closing and reopening your browser to log in again."
				);
			
			User.get(userId, function(error, user) {
				if (error) {
					user = {_id: userId, type: 'user', name: profile.name, roles: []};
					User.set(user, function(error, result) {
						done(null, user);
					});
				}
				else if (user.name !== profile.name) {
					user.name = profile.name;
					User.set(user, function(error, result) {
						done(null, user);
					});
				}
				else
					done(null, user);
			});
		}
		catch (e) {
			done("An error has occured while loggin you in. Are you using a medecinsdumonde.net account?");
		}
	}
);

// Azure AD requires an additional 'resource' parameter for the token request
//  this corresponds to the Azure resource you're requesting access to
//  in our case we're just trying to authenticate, so we just request generic access to the Azure AD graph API
strategy.tokenParams = strategy.authorizationParams = function(options) {
	return { resource: config.oauth.resource };
};

// this is our custom logic for digging into the token returned to us by Azure
//  in raw form its base64 text and we want the corresponding JSON
strategy.userProfile = function(accessToken, done) {
	// thx: https://github.com/QuePort/passport-azure-oauth/blob/master/lib/passport-azure-oauth/strategy.js
	var profile = {};

	try {
		var tokenBase64 = accessToken.split('.')[1],
			tokenBinary = new Buffer(tokenBase64, 'base64'),
			tokenAscii  = JSON.parse(tokenBinary.toString());

		done(null, tokenAscii);
	}
	catch (ex) {
		done(ex, null);
	}
};


passport.use('user_azure', strategy);

/////////////////////////////////////////////////////////////////////////////
// User authentication with bearer token
/////////////////////////////////////////////////////////////////////////////

passport.use('user_accesstoken', new BearerStrategy(function(strAccessToken, done) {
	AccessToken.get(strAccessToken, function(error, accessToken) {
		if (error || !accessToken)
			return done('Invalid Token');

		User.get(accessToken.userId, function(error, user) {
			if (error || !user)
				return done('Invalid User');

			// note that we could add metadata to allow only partial access
			// done(null, user, {scope: something})
			done(null, user);
		});
	});
}));

/////////////////////////////////////////////////////////////////////////////
// User authentication with email and password (MDM partners)
/////////////////////////////////////////////////////////////////////////////

passport.use('partner_local', new LocalStrategy(
	function(username, password, done) {
		database.view('shortlists', 'partners', {key: username}, function(error, data) {
			if (error)
				return done('failed to connect to DB');

			if (data.rows.length == 0)
				return done(null, false);

			var partner = data.rows[0].value;
			if (partner.password !== password)
				return done(null, false);

			done(null, partner)
		})
	}
));


/////////////////////////////////////////////////////////////////////////////
// Client log in, with passport or basic auth.
/////////////////////////////////////////////////////////////////////////////

var authenticateClient = function(clientId, clientSecret, done) {
	Client.get(clientId, function(error, client) {
		if (error || !client)
			return done('Invalid Client');

		// Timing attack yeah!
		// No password hashing yeah!
		if (client.secret !== clientSecret)
			return done(null, false);

		return done(null, client);
	});
};

passport.use('client_basic', new BasicStrategy(authenticateClient));
passport.use('client_password', new ClientPasswordStrategy(authenticateClient));

module.exports = passport;

