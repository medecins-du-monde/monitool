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


import config from '../config';
import nano from 'nano';
import session from 'express-session';
import connectCouchDB from 'connect-couchdb';

const CouchSessionStore = connectCouchDB(session);

const store = new CouchSessionStore({
	name: config.couchdb.sessionBucket,
	host: config.couchdb.host,
	port: config.couchdb.port,
	username: config.couchdb.username,
	password: config.couchdb.password
});


// Create bucket if not existing already
let url = 'http://';
if (config.couchdb.username && config.couchdb.password)
	url += config.couchdb.username + ':' + config.couchdb.password + '@';
url += config.couchdb.host + ':' + config.couchdb.port;

var nn = nano(url);
nn.db.create(config.couchdb.sessionBucket, function(error) {
});

export default store;
