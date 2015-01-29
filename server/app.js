"use strict";

var express = require('express'),
	cors    = require('cors');

express()
	.use(cors())
	.use(require('./middlewares/auth'))

	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))
	.use(require('./controllers/reporting'))

	.listen(8000);
