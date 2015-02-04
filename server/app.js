#!/usr/bin/env node
"use strict";

var express      = require('express'),
	compression  = require('compression'),
	cors         = require('cors'),
	serveStatic  = require('serve-static'),
	cacheControl = require('./middlewares/cache-control');


express()
	.disable('x-powered-by')
	.use(compression())
	.use(cacheControl)
	
	.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? '../client/dev' : '../client/build'))

	.use(cors())
	.use(require('./middlewares/auth'))
	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))
	.use(require('./controllers/reporting'))

	.listen(80);
