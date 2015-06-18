"use strict";

var express        = require('express'),
	cookieParser   = require('cookie-parser'),
	session        = require('express-session'),
	compression    = require('compression'),
	request        = require('request'),
	serveStatic    = require('serve-static'),
	cacheControl   = require('./middlewares/cache-control'),
	passport       = require('./passport'),
	config         = require('../config');

express()
	.disable('x-powered-by')

	.get('/ping', function(request, response) {
		response.send('pong');
	})
	.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? 'client/dev' : 'client/build'))

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

	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))

	.listen(config.port);


// hack: avoid having iis kill the node process.
if (config.ping && config.ping.active)
	setInterval(function() {
		request.get(config.ping.url, function(error, response, data) {
			
		});
	}, 10000);


// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log(err.stack)
});
