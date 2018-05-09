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

import Router from 'koa-router';
import cache from 'memory-cache';

import CubeCollection from '../olap/cube-collection';
import Input from '../resource/model/input';
import Project from '../resource/model/project';

const router = new Router();


/**
 * Generate the cubes for a given project
 */
router.get('/reporting/project/:id', async ctx => {
	// Early quit if user is not allowed to access this project.
	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	// Try serving from cache
	var cacheKey = 'reporting:project:' + ctx.params.id,
		reporting = cache.get(cacheKey);

	if (reporting) {
		ctx.response.body = reporting;
		ctx.response.type = 'application/json';
		return;
	}

	// Serve from main database
	const [project, inputs] = await Promise.all([
		Project.storeInstance.get(ctx.params.id),
		Input.storeInstance.listByProject(ctx.params.id, true)
	]);

	var reporting = JSON.stringify({
		error: false,
		type: 'cubes',
		projectId: project._id,
		cubes: CubeCollection.fromProject(project, inputs).serialize()
	});

	cache.put(cacheKey, reporting, 24 * 3600 * 1000);
	ctx.response.body = reporting;
	ctx.response.type = 'application/json';
});


/**
 * Generates the cubes for a given indicator
 */
router.get('/reporting/indicator/:id', async ctx => {
	if (ctx.state.user.type == 'partner')
		throw new Error('forbidden');

	// Retrieve all stripped down projects that compute this indicator
	// (those contain only the cross-cutting indicator we want, and have all unnecessary
	// forms and variables removed).
	let projects = await Project.storeInstance.listByIndicator(ctx.params.id, true);

	// Remove projects that are not allowed for our user.
	projects = projects.filter(p => ctx.visibleProjectIds.has(p._id));

	// Retrieve all inputs from the data sources of the stripped down projects
	// (all inputs that are no use for this particular indicator won't be fetched)
	const inputsByProject = await Promise.all(
		projects.map(async function(project) {
			const inputsByDataSource = await Promise.all(
				project.forms.map(form => Input.storeInstance.listByDataSource(project._id, form.id, true))
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

	ctx.response.body = {type: 'cubes', cubes: result};
});

export default router;