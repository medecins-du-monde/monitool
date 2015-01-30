"use strict";

var express     = require('express'),
	compression = require('compression'),
	cors        = require('cors');

express()
	.use(cors())
	.use(compression())
	.use(require('./middlewares/auth'))

	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))
	.use(require('./controllers/reporting'))

	.listen(8000);
