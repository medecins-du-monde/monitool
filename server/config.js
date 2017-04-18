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

let winston   = require('winston'),
	validator = require('is-my-json-valid'),
	schema = require('./config-schema');

let config;

try {
	// If there is a config.json file, load configuration from there.
	config = require('../config.json');
	winston.log('info', '[Config] Loading from config.json');
}
catch (e) {
	winston.log('error', '[Config] config.json is missing');
	process.exit(1);
}

// Validate that nothing is missing from the configuration file.
let validate = validator(schema);

validate(config);

var errors = validate.errors || [];
if (errors.length) {
	// if there is errors, log them and exit the process.
	errors.forEach(function(error) {
		winston.log('error', 'Invalid config', error);
	});

	process.exit(1);
}

module.exports = config;