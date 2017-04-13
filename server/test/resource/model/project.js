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
	mockCouch = require('../../mock-database'),
	Project   = require('../../../resource/model/project');

describe('Project', function() {

	beforeEach(function() {
		mockCouch.addDoc('monitool', require('../../data/project.json'));
		mockCouch.addDoc('monitool', require('../../data/input.json'));
	});

	it('should fail to load', function(done) {
		Project.storeInstance.get('8dccaa8a-425a-4a60-b7ca-ccf623b0b27d')
			.then(function() { throw new Error(); })
			.catch(function() { done(); })
	});

	it('should load', function() {
		return Project.storeInstance.get('624c94fa-9ebc-4f8b-8389-f5959149a0a7');
	});

	it('should delete input if entity is deleted', function(done) {


		
	});



});

