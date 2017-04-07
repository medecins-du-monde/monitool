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
	router      = express.Router(),
	config      = require('../config');

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
router.use(express.static(config.debug ? 'client' : 'wwwroot', {
	setHeaders: function(response, path, stat) {
		// When debug=false, files are served directly from the bundles generated on /wwwroot

		// For the loading progress bar to work, we need monitool to give the Content-Length header when serving the file
		// which is not possible when the file is compressed on the fly at every request.
		// => monitool2.js and monitool2.css are compressed at compile time (when running gulp build)
		// => we need to alter the header here for the browser to understand what to do with the file.

		let filename = path.substring(path.lastIndexOf('/') + 1);
		
		if (filename === 'monitool2.js' || filename === 'monitool2.css')
			response.header('Content-Encoding', 'gzip');

		// Fonts will never change => infinite cache control
		if (filename.match(/^\/(fontawesome)/))
			response.setHeader('Cache-Control', 'max-age=31449600,public');
	}
}))


module.exports = router;
