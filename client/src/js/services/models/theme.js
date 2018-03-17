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
	.module('monitool.services.models.theme', ['ngResource'])
	.factory('Theme', function($resource) {
		var Theme = $resource('/resources/theme/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Theme.prototype.reset = function() {
			this.name = {fr: '', en: '', es: ''};
			this.type = 'theme';
		}

		return Theme;
	});
