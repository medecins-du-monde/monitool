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

require('../../mock-database');

let assert    = require('assert'),
	database  = require('../../../resource/database'),
	Project   = require('../../../resource/model/project');

describe('Project', function() {

	beforeEach(function() {
		return database.prepare().then(function() {
			return Promise.all([
				database.insert(require('../../data/project.json')),
				database.insert(require('../../data/input.json'))
			]);
		});
	});

	afterEach(function() {
		return database.destroyBucket();
	});

	describe('load', function() {

		it('should load', function() {
			return Project.storeInstance.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7');
		});

		it('should fail to load a non existing id', function(done) {
			Project.storeInstance.get('8dccaa8a-425a-4a60-b7ca-ccf623b0b27d')
				.then(function() { throw new Error(); })
				.catch(function() { done(); })
		});

		it('should fail to load an id from something else', function(done) {
			Project.storeInstance
				.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7:0c243e08-8c21-4946-9f5f-ce255106901b:8a7980f8-0e47-49bb-bf54-fdbe2013e3ea:2010-02')
				.then(
					function(result) {
						done('should_not_work');
					},
					function(error) {
						done(null, error)
					}
				);
		});
	});

	describe('destroy', function() {

		it('should delete project', function(done) {
			Project.storeInstance
				.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7')
				.then(p => p.destroy())
				.then(r => database.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7'))
				.then(
					function(result) {
						// raise error.
						done('document_found');
					},
					function(error) {
						done();
					}
				);
		});

		it('should delete input if entity is deleted', function(done) {
			Project.storeInstance
				.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7')
				.then(p => p.destroy())
				.then(r => database.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7:0c243e08-8c21-4946-9f5f-ce255106901b:8a7980f8-0e47-49bb-bf54-fdbe2013e3ea:2010-02'))
				.then(
					function(result) {
						// raise error.
						done('document_found');
					},
					function(error) {
						done();
					}
				);
		});
	
	});




});

