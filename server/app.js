"use strict";

var express     = require('express'),
	compression = require('compression'),
	cors        = require('cors'),
	serveStatic = require('serve-static');

var app = express().use(compression());

var staticRouter = new express.Router();
staticRouter
	.use(function(request, response, next) {
		if (request.url.match(/^\/(glyphicons|fontawesome|monitool)/))
			response.setHeader('Cache-Control', 'max-age=31449600,public');
		else
			response.setHeader('Cache-Control', 'max-age=0,public');
		next();
	})
	.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? '../client/dev' : '../client/build'));

var apiRouter = new express.Router();
apiRouter
	.use(cors())
	.use(require('./middlewares/auth'))
	.use(require('./controllers/public'))
	.use(require('./controllers/restricted'))
	.use(require('./controllers/reporting'));

app.use(staticRouter).use(apiRouter);

app.listen(8000);
