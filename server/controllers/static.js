"use strict";

var express     = require('express'),
	serveStatic = require('serve-static'),
	router      = express.Router();


/**
 * Ping route, used to check if the service is online.
 */
router.get('/ping', function(request, response) {
	response.send('pong');
});

/**
 * Serve static files.
 * This could be done by the webserver.
 */
router.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? 'client/dev' : 'client/build'));

module.exports = router;
