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

import winston from 'winston';
import validator from 'is-my-json-valid';
import schema from './config-schema.json';
import fs from 'fs';

const toBool = function(str) {
	return str && str !== '0' && str.toLowerCase() != 'false';
};

const readFile = function(secret) {
	try {
		return fs.readFileSync(secret, "utf8").trim();
	}
	catch (e) {
		return null;
	}
};

const config = {
	"debug": toBool(process.env.MONITOOL_DEBUG),
	"baseUrl": process.env.MONITOOL_BASE_URL || "http://localhost:8000",
	"port": parseInt(process.env.MONITOOL_PORT) || 8000,
	"cookieSecret":
		process.env.MONITOOL_COOKIE_SECRET ||
		readFile(process.env.MONITOOL_COOKIE_SECRET_FILE),

	"couchdb": {
		"host": process.env.MONITOOL_COUCHDB_HOST || "couchdb",
		"port": parseInt(process.env.MONITOOL_COUCHDB_PORT) || 5984,
		"bucket": process.env.MONITOOL_COUCHDB_DATABUCKET || "monitool",
		"sessionBucket": process.env.MONITOOL_COUCHDB_SESSIONBUCKET || "monitool-sessions",
		"username":
			process.env.MONITOOL_COUCHDB_USER ||
			readFile(process.env.MONITOOL_COUCHDB_USER_FILE) ||
			"",
		"password":
			process.env.MONITOOL_COUCHDB_PASS ||
			readFile(process.env.MONITOOL_COUCHDB_PASS_FILE) ||
			""
	},
	"api": {
		"google":
			process.env.MONITOOL_API_GOOGLE ||
			readFile(process.env.MONITOOL_API_GOOGLE_FILE)
	},
	"auth": {
		"administrator": process.env.MONITOOL_AUTH_ADMINISTRATOR,
		"providers": {
		}
	}
};

if (toBool(process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD))
	config.auth.providers.azureAD = {
		"label": process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_LABEL || "Use azure account",
		"domain": process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_DOMAIN || "hotmail.com",
		"clientId":
			process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTID ||
			readFile(process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTID_FILE),
		"clientSecret":
			process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTSECRET ||
			readFile(process.env.MONITOOL_AUTH_PROVIDERS_AZUREAD_CLIENTSECRET_FILE),
	};

if (toBool(process.env.MONITOOL_AUTH_PROVIDERS_TRAINING))
	config.auth.providers.training = {
		"label": process.env.MONITOOL_AUTH_PROVIDERS_TRAINING_LABEL || "Use training account (admin)",
		"account": process.env.MONITOOL_AUTH_PROVIDERS_TRAINING_ACCOUNT || "training"
	};


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

export default config;
