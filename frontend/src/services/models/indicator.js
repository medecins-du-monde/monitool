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

angular
	.module('monitool.services.models.indicator', ['ngResource'])
	.factory('Indicator', function($resource) {

		var Indicator = $resource('/api/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Indicator.fetchForProject = function(project) {
			return Indicator.query({mode: "project_indicators", projectId: project._id}).$promise;
		};

		Indicator.prototype.reset = function() {
			this.type = "indicator";
			this.name = {en: '', fr: '', es: ''};
			this.description = {en: '', fr: '', es: ''};
			this.themes = [];
		};

		return Indicator;
	});
