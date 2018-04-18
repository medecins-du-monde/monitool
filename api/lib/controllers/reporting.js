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

import express from 'express';
import cache from 'memory-cache';
import Input from '../resource/model/input';
import Project from '../resource/model/project';
import CubeCollection from '../olap/cube-collection';


export default express.Router()

	/**
	 * Generate the cubes for a given project
	 */
	.get('/project/:id', function(request, response) {
		Promise.resolve().then(async () => {
			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);

			// Early quit if user is not allowed to access this project.
			if (visibleIds.indexOf(request.params.id) === -1)
				throw new Error('forbidden');

			var cacheKey = 'reporting:project:' + request.params.id,
				reporting = cache.get(cacheKey);

			if (reporting) {
				response.header('Content-Type', 'application/json');
				response.send(reporting);
			}
			else {
				const [project, inputs] = await Promise.all([
					Project.storeInstance.get(request.params.id),
					Input.storeInstance.listByProject(request.params.id)
				]);

				var reporting = JSON.stringify({
					error: false,
					type: 'cubes',
					projectId: project._id,
					cubes: CubeCollection.fromProject(project, inputs).serialize()
				});

				cache.put(cacheKey, reporting, 24 * 3600 * 1000);

				response.header('Content-Type', 'application/json');
				response.send(reporting);
			}
		}).catch(response.jsonErrorPB);
	})

	/**
	 * Generates the cubes for a given indicator
	 */
	.get('/indicator/:id', function(request, response) {
		Promise.resolve().then(async () => {
			if (request.user.type == 'partner')
				throw new Error('forbidden');

			// Retrieve all stripped down projects that compute this indicator
			// (those contain only the cross-cutting indicator we want, and have all unnecessary
			// forms and variables removed).
			let [projects, visibleIds] = await Promise.all([
				Project.storeInstance.listByIndicator(request.params.id, true),
				Project.storeInstance.listVisibleIds(request.user)
			])

			// Remove projects that are not allowed for our user.
			projects = projects.filter(p => visibleIds.indexOf(p._id) !== -1);

			// Retrieve all inputs from the data sources of the stripped down projects
			// (all inputs that are no use for this particular indicator won't be fetched)
			const inputsByProject = await Promise.all(
				projects.map(async function(project) {
					const inputsByDataSource = await Promise.all(
						project.forms.map(form => Input.storeInstance.listByDataSource(project._id, form.id))
					);

					return inputsByDataSource.reduce((memo, arr) => memo.concat(arr), []);
				})
			);

			// Merge the results
			var result = {};
			for (var i = 0; i < projects.length; ++i) {
				var project = projects[i], inputs = inputsByProject[i];
				result[project._id] = CubeCollection.fromProject(project, inputs).serialize();
			}

			response.json({type: 'cubes', cubes: result});

		}).catch(response.jsonErrorPB);
	});
