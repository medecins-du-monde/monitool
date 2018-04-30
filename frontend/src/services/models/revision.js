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

import angular from 'angular';
import jsonpatch from 'fast-json-patch';
import ngResource from 'angular-resource';


const module = angular.module(
	'monitool.services.models.revision',
	[
		ngResource
	]
);

module.factory('Revision', function($resource) {
	var Revision = $resource('/api/resources/project/:projectId/revisions');

	Revision.enrich = function(project, revisions) {
		// Complete the information by computing afterState, beforeState, and forward patches.
		for (var i = 0; i < revisions.length; ++i) {
			if (revisions[i].before || revisions[i].after)
				continue;

			// Compute before and after state
			revisions[i].after = i === 0 ? project : revisions[i - 1].before;

			revisions[i].before = jsonpatch.applyPatch(
				jsonpatch.deepClone(revisions[i].after),
				revisions[i].backwards
			).newDocument;

			revisions[i].isEquivalent = angular.equals(project, revisions[i].before);
		}
	}


	return Revision;
});

export default module;