#!/usr/bin/env node
"use strict";

var express        = require('express'),
	cookieParser   = require('cookie-parser'),
	session        = require('express-session'),
	compression    = require('compression'),
	cors           = require('cors'),
	serveStatic    = require('serve-static'),
	cacheControl   = require('./middlewares/cache-control'),

	passport       = require('./passport');


express()
	.disable('x-powered-by')

	.use(cookieParser())
	.use(session({ secret: 'cd818da5bcd0d3d9ba5a9a44e49148d2', resave: false, saveUninitialized: false }))
	.use(passport.initialize())
	.use(passport.session())

	.get('/login', passport.authenticate('oauth2'))

	.get('/logout', function(request, response) {
		request.logout();
		response.redirect('/')
	})

	.get(
		'/auth/callback',
		passport.authenticate('oauth2', { failureRedirect: '/login' }),
		function(request, response) {
			response.redirect('/');
		}
	)

	.use(function(request, response, next) {
		if (request.isAuthenticated())
			return next();

		response.redirect('/login')
	})

	.use(compression())
	.use(cacheControl)

	.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? '../client/dev' : '../client/build'))
	// .use(cors())
	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))
	.use(require('./controllers/reporting'))

	.listen(8000);
