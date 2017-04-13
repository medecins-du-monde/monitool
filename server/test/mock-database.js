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

// Start mock couch
let mockCouch = require('mock-couch');


// Tell app to use it.
let config = require('../config');
config.couchdb.host = 'localhost';
config.couchdb.port = 5985;

let couchdb = mockCouch.createServer();
couchdb.listen(5985);
couchdb.addDB('monitool', [
	{_id: 'version', 'version': 4}
]);

// start up database
require('../resource/database');

module.exports = couchdb;