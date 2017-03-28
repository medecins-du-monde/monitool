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

try {
	module.exports = require('../config.json');
}
catch (e) {
	module.exports = {
		debug: process.env.DEBUG === 'TRUE',
		port: process.env.PORT,
		couchdb: {
			url: process.env['couchdb.url'],
			bucket: process.env['couchdb.bucket'],
			host: process.env['couchdb.host'],
			sessionBucket: process.env['couchdb.sessionBucket'],
			username: process.env['couchdb.username'],
			password: process.env['couchdb.password']
		},
		oauth: {
			authUrl: process.env['oauth.authUrl'],
			tokenUrl: process.env['oauth.tokenUrl'],
			clientId: process.env['oauth.clientId'],
			clientSecret: process.env['oauth.clientSecret'],
			callbackUrl: process.env['oauth.callbackUrl'],
			resource: process.env['oauth.resource']
		}
	}
}
