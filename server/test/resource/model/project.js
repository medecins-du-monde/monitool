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

const INPUT_ID = '624c94fa-9ebc-4f8b-8389-f5959149a0a7:0c243e08-8c21-4946-9f5f-ce255106901b:8a7980f8-0e47-49bb-bf54-fdbe2013e3ea:2010-02',
	PROJECT_ID = '624c94fa-9ebc-4f8b-8389-f5959149a0a7';

describe('Project', function() {

	beforeEach(function() {
		return database.prepare().then(function() {
			return Promise.all([
				database.insert(require('../../data/project.json')),
				database.insert(require('../../data/input.json')),
				database.insert(require('../../data/theme.json'))
			]);
		});
	});

	afterEach(function() {
		return database.destroyBucket();
	});

	describe('load', function() {

		it('should load', function() {
			return Project.storeInstance.get(PROJECT_ID);
		});

		it('should fail to load a non existing id', function(done) {
			Project.storeInstance.get('8dccaa8a-425a-4a60-b7ca-ccf623b0b27d')
				.then(function() { throw new Error(); })
				.catch(function() { done(); })
		});

		it('should fail to load an id from something else', function(done) {
			Project.storeInstance
				.get(INPUT_ID)
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
				.get(PROJECT_ID)
				.then(p => p.destroy())
				.then(r => database.get(PROJECT_ID))
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

		it('should delete input when project is deleted', function(done) {
			Project.storeInstance
				.get(PROJECT_ID)
				.then(p => p.destroy())
				.then(r => database.get(INPUT_ID))
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

	describe('validateForeignKeys', function() {

		it('should work with existent theme', function(done) {
			Project.storeInstance.get(PROJECT_ID)
				.then(function(project) {
					project.themes.push("49dc29ed-a025-40bd-97a2-da5f519f8907");
					return project.save();
				})
				.then(
					function() {
						done();
					},
					function() {
						done('should_succeded')
					}
				);
		});

		it('should fail with non existent theme', function(done) {
			Project.storeInstance.get(PROJECT_ID)
				.then(function(project) {
					project.themes.push("995eb975-6916-41cd-ba0a-018b866cc68b");
					return project.save();
				})
				.then(
					function() {
						done('should_have_failed')
					},
					function() {
						done();
					}
				);
		});

	});

	describe('save', function() {

		describe('_computeInputsUpdates', function() {

			it('should not touch inputs when datasource is changed', function(done) {
				let input;

				Promise.all([
					database.get(INPUT_ID),
					Project.storeInstance.get(PROJECT_ID)
				]).then(function(results) {
					input = results[0];

					results[1].forms[0].name = 'toto';
					return results[1].save();
				})
				.then(r => database.get(INPUT_ID))
				.then(
					function(result) {
						assert.deepEqual(input, result);
						done();
					},
					function(error) {
						done('document_missing');
					}
				);
			});

			it('should delete input when datasource is deleted', function(done) {
				Project.storeInstance
					.get(PROJECT_ID)
					.then(function(project) {
						project.forms.splice(0, 1);
						return project.save();
					})
					.then(r => database.get(INPUT_ID))
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

			it('should delete input when entity is deleted', function(done) {
				Project.storeInstance
					.get(PROJECT_ID)
					.then(function(project) {
						project.entities.splice(0, 1);
						return project.save();
					})
					.then(r => database.get(INPUT_ID))
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

});

