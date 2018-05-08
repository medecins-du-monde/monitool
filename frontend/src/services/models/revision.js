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

import jsonpatch from 'fast-json-patch';


export default class Revision {

	static async fetch(projectId, offset, limit) {
		const response = axios.get(
			'/api/resources/project/' + projectId + '/revisions',
			{params: {projectId: projectId, offset: offset, limit: limit}}
		);

		return response.data.map(r => new Revision(r));
	}

	static enrich(project, revisions) {
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
}
