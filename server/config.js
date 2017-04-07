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
	// otherwise, fallback to environnement variables.
	config = {
		debug: process.env['monitool.debug'] === 'TRUE',
		baseUrl: process.env['monitool.baseUrl'],
		port: parseInt(process.env['monitool.port']),
		couchdb: {
			host: process.env['monitool.couchdb.host'],
			port: parseInt(process.env['monitool.couchdb.port']),
			bucket: process.env['monitool.couchdb.bucket'],
			sessionBucket: process.env['monitool.couchdb.sessionBucket'],
			username: process.env['monitool.couchdb.username'],
			password: process.env['monitool.couchdb.password']
		},
		auth: {
			azureAD: {
				label: process.env['monitool.auth.azureAD.label'],
				domain: process.env['monitool.auth.azureAD.domain'],
				authUrl: process.env['monitool.auth.azureAD.authUrl'],
				tokenUrl: process.env['monitool.auth.azureAD.tokenUrl'],
				clientId: process.env['monitool.auth.azureAD.clientId'],
				clientSecret: process.env['monitool.auth.azureAD.clientSecret']
			},
			training: {
				label: process.env['monitool.auth.training.label']
			}
		}
	};
	
	winston.log('info', '[Config] Loading from environnement variables');
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