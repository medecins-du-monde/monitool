#!/usr/bin/env node

"use strict";

var express      = require('express'),
	compression  = require('compression'),
	cookieParser = require('cookie-parser'),
	session      = require('express-session'),
	path         = require('path'),
	passport     = require('../server/authentication/passport'),
	config       = require('../server/config');

var CouchSessionStore = require('connect-couchdb')(session),
	store = new CouchSessionStore({
		name: config.couchdb.sessionBucket,
		host: config.couchdb.host,
		port: config.couchdb.port,
		username: config.couchdb.username,
		password: config.couchdb.password
	});




express()
	.disable('x-powered-by')

	// By default users should never cache anything.
	.use(function(request, response, next) {
		response.setHeader('Cache-Control', 'max-age=0,public');
		next();
	})

	// Serve static files.
	.use(require('../server/controllers/static'))

	// Enable template engine.
	.set('view engine', 'jade')
	.set('views', path.join(__dirname, '../server/views'))

	// Serve index page.
	.use(require('../server/controllers/pages'))
	
	// Enable dynamic sessions and compression for the rest.
	.use(cookieParser())
	.use(session({ secret: 'cd818da5bcd0d3d9ba5a9a44e49148d2', resave: false, saveUninitialized: false, store: store }))
	.use(passport.initialize())
	.use(passport.session())
	.use(compression())

	// Serve authentication related pages.
	.use('/authentication', require('../server/controllers/authentication'))

	// Serve API
	.use(require('../server/middlewares/status-code'))
	.use('/resources', require('../server/controllers/resources'))
	.use('/reporting', require('../server/controllers/reporting'))
	
	.listen(config.port);

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
	// handle the error safely
	console.log(err.stack)
});
