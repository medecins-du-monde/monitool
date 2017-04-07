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

const nano = require('nano'),
	config = require('../config'),
	winston = require('winston');

class Database {

	get url() {
		let url = 'http://';

		if (!this.config)
			url += 'localhost:5984';

		else {
			if (this.config.username && this.config.password)
				url += this.config.username + ':' + this.config.password + '@';

			url += this.config.host || 'localhost';
			url += ':' + (this.config.port || 5984);
		}

		return url;
	}

	get bucketName() {
		if (this.config && this.config.bucket)
			return this.config.bucket;
		else
			return 'monitool';
	}

	constructor(config) {
		this.config = config;
		this.nano = nano(this.url);
		this.database = this.nano.use(this.bucketName)
	}

	prepare() {
		return this
			._checkConnectivity()
			.then(() => this._createBucket())
			.then(() => this._applyMigrations())
	}

	_checkConnectivity() {
		return new Promise(function(resolve, reject) {
			this.nano.db.list(function(error, body) {
				if (error)
					reject(new Error('Cannot connect to couchdb'));
				else
					resolve(body);
			});
		}.bind(this));
	}

	_createBucket() {
		return new Promise(function(resolve, reject) {
			this.nano.db.create(this.bucketName, function(error) {
				if (error && error.error !== 'file_exists')
					reject(error);
				else
					resolve();
			});
		}.bind(this));
	}

	_applyMigrations() {

		let applyMigration = function(versionDoc) {
			let nextMigration;
			try {
				nextMigration = require('./migrations/migration-' + versionDoc.version);
			}
			catch (e) {
				winston.log('info', '[Database] No more migrations. Current version is ', versionDoc.version);
				return;
			}

			winston.log('info', '[Database] Updating from version ' + versionDoc.version);
			return nextMigration().then(function() {
				versionDoc.version += 1;

				return this.insert(versionDoc).then(() => applyMigration(versionDoc))
			}.bind(this));
		}.bind(this);

		winston.log('info', '[Database] Checking for migrations');
		
		return this.get('version')
			.catch(error => ({_id: "version", version: 0})) // if version is not found => version is 0
			.then(applyMigration);
	}

	/**
	 * Wrap view queries to database into a promise
	 * 
	 * @protected
	 * @param  {string} viewName
	 * @param  {Object} options
	 * @return {Array}
	 */
	callView(viewName, options) {
		return new Promise(function(resolve, reject) {
			this.database.view('monitool', viewName, options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
	}

	/**
	 * Wrap list queries to database into a promise
	 * 
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	callList(options) {
		return new Promise(function(resolve, reject) {
			this.database.list(options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
	}

	/**
	 * Wrap bulk queries to database into a promise
	 * 
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	callBulk(options) {
		return new Promise(function(resolve, reject) {
			this.database.bulk(options, function(error, result) {
				if (error)
					reject(error);
				else
					resolve(result);
			});
		}.bind(this));
	}

	/**
	 * Retrieve a given model
	 * 
	 * @return {Model}
	 */
	get(id) {
		return new Promise(function(resolve, reject) {
			this.database.get(id, function(error, data) {
				if (error)
					reject(error);
				else
					resolve(data);
			});
		}.bind(this));
	}

	insert(doc) {
		return new Promise(function(resolve, reject)  {
			this.database.insert(doc, function(error, result) {
				if (error)
					reject(error)
				else {
					doc._rev = result.rev;
					resolve();
				}
			});
		}.bind(this));
	}

	destroy(id, rev) {
		return new Promise(function(resolve, reject) {
			this.database.destroy(id, rev, function(error) {
				if (error)
					reject(error);
				else
					resolve();
			}.bind(this));
		}.bind(this));
	}
}


var database = new Database(config.couchdb);

module.exports = database;

database.prepare().catch(function(error) {
	winston.log('error', 'Could not start database: ' + error.message);
	process.exit(1);
});

