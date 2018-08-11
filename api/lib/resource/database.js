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

import nano from 'nano';
import winston from 'winston';
import config from '../config/config';
import migrations from './migrations/index';

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

	async checkConnectivity() {
		try {
			return this.nano.db.list();
		}
		catch (e) {
			throw new Error('Cannot connect to couchdb');
		}
	}

	async prepare() {
		await this._createBucket();
		await this._applyMigrations();
	}

	async destroyBucket() {
		if (this.bucketName.indexOf('test') === -1)
			throw new Error('This method shall never be called on a production server.');

		await this.nano.db.destroy(this.bucketName);
	}

	async _createBucket() {
		try {
			await this.nano.db.create(this.bucketName);
		}
		catch (e) {
			if (e && e.error !== 'file_exists')
				throw e;
		}
	}

	async _applyMigrations() {
		winston.log('info', '[Database] Checking for migrations');

		// Retrieve current database version
		let versionDoc;
		try {
			versionDoc = await this.get('version');
		}
		catch (error) {
			versionDoc = {_id: "version", version: 0};
		}

		for (let i = versionDoc.version; i < migrations.length; ++i) {
			winston.log('info', '[Database] Updating from version ' + versionDoc.version);

			await migrations[i]();
			versionDoc.version += 1;
			await this.insert(versionDoc);
		}

		winston.log('info', '[Database] No more migrations. Current version is ' + versionDoc.version);
	}

	/**
	 * Wrap view queries to database into a promise
	 *
	 * @protected
	 * @param  {string} viewName
	 * @param  {Object} options
	 * @return {Array}
	 */
	async callView(viewName, options) {
		return this.database.view('monitool', viewName, options);
	}

	/**
	 * Wrap list queries to database into a promise
	 *
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	async callList(options) {
		return this.database.list(options);
	}

	/**
	 * Wrap bulk queries to database into a promise
	 *
	 * @protected
	 * @param  {Object} options
	 * @return {Array}
	 */
	async callBulk(options) {
		return this.database.bulk(options);
	}

	/**
	 * Retrieve a given model
	 *
	 * @return {Model}
	 */
	async get(id, params=undefined) {
		return this.database.get(id, params);
	}

	async insert(doc) {
		const result = await this.database.insert(doc);
		doc._rev = result.rev;
	}

	async destroy(id, rev) {
		if (typeof id !== 'string' || typeof rev !== 'string')
			throw new Error('invalid call to destroy.');

		return this.database.destroy(id, rev);
	}
}

export default new Database(config.couchdb);
