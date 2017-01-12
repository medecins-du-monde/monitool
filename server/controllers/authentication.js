"use strict";

var express    = require('express'),
	passport   = require('../authentication/passport'),
	server     = require('../authentication/oauth'),
	Client     = require('../models/authentication/client'),
	bodyParser = require('body-parser').urlencoded({extended: false});

module.exports = express.Router()

	///////////////////////////////////////////////////////////////
	// Configure Oauth Routes
	///////////////////////////////////////////////////////////////

	/**
	 * Users gets send here to be presented a dialog asking them if they OK the client accessing their data.
	 * They come with the client id and the return URL that we have to send them to with their autorization code once they say OK.
	 */
	.get(
		'/authorization',

		// check that user is properly authenticated or send him to microsoft with a custom callback URL
		function(request, response, next) {
			if (request.isAuthenticated && request.isAuthenticated() && request.user && request.user.type === 'user')
				next();
			else {
				request.session.nextUrl = request.originalUrl;
				response.render('redirect', {url: '/authentication/login'});
			}
		},

		// check that client exists, is in our allowed client list, and asked a redirectURI consistent with what it registered.
		server.authorization(function(clientId, redirectURI, done) {
			Client.get(clientId, function(error, client) {
				if (error)
					done(error);

				if (client.allowedRedirects.indexOf(redirectURI) === -1)
					done('This URL is not in the clients allow list.');

				return done(null, client, redirectURI);
			});
		}),

		function(request, response) {
			response.render(
				'permission-dialog',
				{
					transactionID: request.oauth2.transactionID,
					user: request.user,
					client: request.oauth2.client
				}
			);
		}
	)

	/**
	 * This handler is called when submitting the form from /authorization
	 */
	.post(
		'/decision',

		// Check that user is properly authenticated
		function(request, response, next) {
			if (request.isAuthenticated && request.isAuthenticated() && request.user && request.user.type === 'user')
				next();
			else
				response.status(401).send('You need to be logged in to access this page.');
		},

		// Parse request body
		bodyParser,
		
		// Delegate handling the decision result to oauth2orize
		server.decision()
	)

	/**
	 * This handler is called by oauth2 clients to get an access token
	 */
	.post(
		'/access',

		// Parse request body
		bodyParser,

		// can be called either from client or user to get a token.
		// so we need to authenticate one or the other.
		passport.authenticate(['client_basic', 'client_password'], { session: false }),

		// Delegate the rest to oauth2orize.
		server.token(),
		server.errorHandler()
	)

	///////////////////////////////////////////////////////////////
	// Configure Login/Logout routes.
	///////////////////////////////////////////////////////////////

	/**
	 * This handler is POSTed to validate the username and password of partners
	 */
	.post(
		'/login-partner',
		bodyParser,
		passport.authenticate('partner_local', {
			successRedirect: '/',
			failureRedirect: '/',
		})
	)

	/**
	 * This handler is called to log in users with azure oauth.
	 * It checks if user is already logged in, and redirect to azure if not.
	 */
	.get(
		'/login',

		// Check that user is not already logged in.
		function(request, response, next) {
			if (request.isAuthenticated && request.isAuthenticated() && request.user && request.user.type === 'user') {
				// we need to check for nextUrl because authorize may have sent us here if some dark cookie+302 magic prevented him from knowing who it was speaking to.
				if (request.session.nextUrl) {
					response.render('redirect', {url: request.session.nextUrl});
					delete request.session.nextUrl;
				}
				else
					response.render('redirect', {url: '/'});
			}
			else
				next();
		},
		
		passport.authenticate('user_azure')
	)

	/**
	 * This handler is called when users come back from azure.
	 */
	.get(
		'/login-callback',
		
		passport.authenticate('user_azure', {
			failureRedirect: '/'
		}),
		
		function(request, response) {
			if (request.session.nextUrl) {
				response.render('redirect', {url: request.session.nextUrl});
				delete request.session.nextUrl;
			}
			else
				response.render('redirect', {url: '/'});
		}
	)

	/**
	 * Log current user out.
	 * FIXME This query should be POST: loggin an user out is not idempotent.
	 */
	.get('/logout', function(request, response) {
		request.session.destroy();
		request.logout();
		response.redirect('/');
	});
