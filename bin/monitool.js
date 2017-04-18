#!/usr/bin/env node

"use strict";

var express      = require('express'),
	compression  = require('compression'),
	cookieParser = require('cookie-parser'),
	session      = require('express-session'),
	path         = require('path'),
	winston      = require('winston'),
	database     = require('../server/resource/database'),
	passport     = require('../server/authentication/passport'),
	sessionStore = require('../server/authentication/session-store'),
	config       = require('../server/config');

// Catch the uncaught errors that weren't wrapped in a domain or try catch statement
process.on('uncaughtException', function(err) {
	// This should absolutely never be called, as we handle all errors insides promises.
	console.log(err.stack)
});

let application = express()
	.disable('x-powered-by')

	// By default users should never cache anything.
	.use(function(request, response, next) {
		response.setHeader('Cache-Control', 'max-age=0,public');
		next();
	})

	.use(require('../server/middlewares/logger'))

	// Serve static files.
	.use(require('../server/controllers/static'))

	// Enable template engine.
	.set('view engine', 'pug')
	.set('views', path.join(__dirname, '../server/views'))

	// Enable dynamic sessions and compression for the rest.
	.use(cookieParser())
	.use(session({ secret: 'cd818da5bcd0d3d9ba5a9a44e49148d2', resave: false, saveUninitialized: false, store: sessionStore }))
	.use(passport.initialize())
	.use(passport.session())
	.use(compression())

	// Serve index page.
	.use(require('../server/controllers/pages'))

	// Serve authentication related pages.
	.use('/authentication', require('../server/controllers/authentication')) // eg: login page, ...

	// Serve API
	.use(require('../server/middlewares/force-authentication'))		// From now on, all pages require auth
	.use(require('../server/middlewares/status-code'))				// Add helpers to the response object
	.use('/resources', require('../server/controllers/pdf'))		// PDF generation module
	.use('/resources', require('../server/controllers/resources'))	// REST JSON API
	.use('/reporting', require('../server/controllers/reporting'))	// Reporting API



database.prepare().then(
	function() {
		application.listen(config.port);
	},
	function(error) {
		winston.log('error', 'Could not start database: ' + error.message);
		process.exit(1);
	}
);
