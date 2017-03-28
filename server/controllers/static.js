/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

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
router.use(serveStatic(process.argv.indexOf('--dev') !== -1 ? 'client' : 'wwwroot'));

module.exports = router;
