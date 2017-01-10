"use strict";

var express      = require('express'),
	compression  = require('compression'),
	cookieParser = require('cookie-parser'),
	session      = require('express-session'),
	path         = require('path'),
	passport     = require('./authentication/passport'),
	config       = require('../config');

var CouchSessionStore = require('connect-couchdb')(session),
	store = new CouchSessionStore({
		name: config.couchdb.sessionBucket,
		host: config.couchdb.host,
		username: config.couchdb.username,
		password: config.couchdb.password
	});

var statusCodes = {
	wrong_type: 400,	// id collision
	forbidden: 403,		// trying to get forbidden item

	// list
	invalid_mode: 400,	// unknown mode: ex project?mode=withoutname
	missing_parameter: 400,	// required parameter is missing for given mode.

	// fetch
	missing: 404,		// trying to get non existing item
	
	// put
	id_mismatch: 400,	// id in URL and model do not match
	invalid_data: 400,	// saving entity that did not pass validation
};


express()
	.disable('x-powered-by')

	.set('view engine', 'jade')
	.set('views', path.join(__dirname, 'views'))

	.use(compression())
	
	.use(function(request, response, next) {
		if (request.url.match(/^\/(glyphicons|fontawesome)/))
			response.setHeader('Cache-Control', 'max-age=31449600,public');
		else
			response.setHeader('Cache-Control', 'max-age=0,public');
		next();
	})

	.use(function(request, response, next) {

		response.jsonError = function(error) {
			response.status(statusCodes[error.message] || 500);

			if (config.debug)
				response.json(error);
			else
				response.json({message: error.message});
		};

		response.jsonErrorPB = response.jsonError.bind(response);
		response.jsonPB = response.json.bind(response);

		next();
	})

	.use(require('./controllers/static'))

	.use(cookieParser())
	.use(session({ secret: 'cd818da5bcd0d3d9ba5a9a44e49148d2', resave: false, saveUninitialized: false, store: store }))
	.use(passport.initialize())
	.use(passport.session())

	.use('/authentication', require('./controllers/authentication'))
	.use('/resources', require('./controllers/resources'))
	.use('/reporting', require('./controllers/reporting'))
	
	.listen(config.port);

// catch the uncaught errors that weren't wrapped in a domain or try catch statement
// do not use this in modules, but only in applications, as otherwise we could have multiple of these bound
process.on('uncaughtException', function(err) {
	// handle the error safely
	console.log(err.stack)
});

