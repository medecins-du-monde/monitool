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

import Indicator from '../resource/model/indicator';
import Input from '../resource/model/input';
import Project from '../resource/model/project';
import Theme from '../resource/model/theme';
import User from '../resource/model/user';

const router = new Router();

/**
 * Get current logged in account information
 * This is used by the client to check if current session is valid and learn user name for display purposes.
 */
router.get('/resources/myself', async ctx => {
	ctx.response.body = ctx.state.user;
});

/**
 * Retrieve multiple projects.
 *
 * Multiple modes are supported
 * 		- no parameter: Retrieve all projects.
 *		- ?mode=short: Retrieve all projects (only country, name, themes, and current user).
 *		- ?mode=crossCutting&indicatorId=123: Retrieve projects that collect indicator 123 (bare minimum to compute indicator from cubes).
 */
router.get('/resources/project', async ctx => {
	let projects;
	if (ctx.state.user.type === 'user' && ctx.request.query.mode === 'short')
		projects = await Project.storeInstance.listShort(ctx.state.user._id);

	else {
		if (ctx.request.query.mode === 'crossCutting')
			projects = await Project.storeInstance.listByIndicator(ctx.request.query.indicatorId, true);
		else if (ctx.request.query.mode === undefined)
			projects = await Project.storeInstance.list();
		else
			throw new Error('invalid_mode');

		// listShort, listByIndicator and list require a post processing step
		// to hide passwords (which is not the case for listShort)
		projects = projects.map(p => p.toAPI())
	}

	// Filter projects depending on ACL.
	ctx.response.body = projects.filter(p => ctx.visibleProjectIds.has(p._id));
})

/**
 * Retrieve one project
 */
router.get('/resources/project/:id', async ctx => {
	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	const project = await Project.storeInstance.get(ctx.params.id);
	ctx.response.body = project.toAPI();
})

/**
 * Retrieve one project
 */
router.get('/resources/project/:id/revisions', async ctx => {
	if (!ctx.visibleProjectIds.has(ctx.params.id))
		throw new Error('forbidden');

	const revisions = await Project.storeInstance.listRevisions(
		ctx.params.id,
		ctx.request.query.offset,
		ctx.request.query.limit
	);

	ctx.response.body = revisions;
})


/**
 * Save a project
 */
router.put('/resources/project/:id', async ctx => {
	// User is cloning a project
	if (ctx.request.query.from) {
		// Check that destination id is valid.
		if (!/^project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(ctx.params.id))
			throw new Error('invalid_data');

		// This is a project creation, make sure that user is not a partner and has permission.
		const u = ctx.state.user;
		const isAllowed = u.type === 'user' && (u.role === 'admin' || u.role === 'project');
		if (!isAllowed)
			throw new Error('forbidden');

		// If the destination id is taken, this is forbidden (we won't overwrite).
		try {
			await Project.storeInstance.get(ctx.params.id);
			throw new Error('forbidden');
		}
		catch (error) {
			if (error.message !== 'missing')
				throw error;
		}

		// Let fetch the origin project, and check that our user can access it legally
		const project = await Project.storeInstance.get(ctx.request.query.from);
		if (project.visibility === 'private' && !project.users.find(u => u.id === ctx.state.user._id))
			throw new Error('forbidden');

		// Clone the project
		project._id = ctx.params.id;
		delete project._rev;
		project.users = [{type: "internal", id: ctx.state.user._id, role: "owner"}];
		await project.save();

		// Recreate all inputs asynchronously. No need to have the user waiting.
		if (ctx.request.query.with_data == 'true')
			Input.storeInstance.listByProject(ctx.request.query.from).then(inputs => {
				inputs.forEach(input => {
					input._id = 'input:' + project._id + ':' + input.form + ':' + input.entity + ':' + input.period;
					delete input._rev;
					input.project = project._id;
				});

				Input.storeInstance.bulkSave(inputs);
			});

		ctx.response.body = project.toAPI();
	}
	// User is saving a project
	else {
		// Validate that the _id in the payload is the same as the id in the URL.
		if (ctx.request.body._id !== ctx.params.id)
			throw new Error('id_mismatch');

		// Get old project
		let oldProject = null;
		try {
			oldProject = await Project.storeInstance.get(ctx.params.id);
		}
		catch (error) {
			if (error.message !== 'missing')
				throw error;
		}

		// Check ACLS
		if (oldProject) {
			// This is a project update, we need to make sure that user is owner.
			if ('owner' !== oldProject.getRole(ctx.state.user))
				throw new Error('forbidden');
		}
		else {
			// This is a project creation, make sure that user is not a partner and has permission.
			let u = ctx.state.user;
			let isAllowed = u.type === 'user' && (u.role === 'admin' || u.role === 'project');
			if (!isAllowed)
				throw new Error('forbidden');
		}

		// Create the project.
		cache.del('reporting:project:' + ctx.params.id); // This empties the reporting cache

		const newProject = new Project(ctx.request.body);
		await newProject.save(false, ctx.state.user);

		ctx.response.body = newProject.toAPI();
	}
})

/**
 * Delete a project
 */
router.delete('/resources/project/:id', async ctx => {
	// Partners cannot delete projects (that would be deleting themselves).
	if (ctx.state.user.type !== 'user')
		throw new Error('forbidden');

	const project = await Project.storeInstance.get(ctx.params.id);

	// Ask the project if it is deletable.
	if (project.getRole(ctx.state.user) !== 'owner')
		throw new Error("forbidden");

	cache.del('reporting:project:' + ctx.params.id);

	ctx.response.body = await project.destroy();
});


/**
 * Retrieve a list of inputs, or inputs ids.
 *
 * Multiple modes are supported
 * 		- ids_by_form: retrieve all input ids that match a given projectId and formId
 *		- ids_by_entity: retrieve all inputs ids that match a given projectId and entityId
 * 		- current+last: retrieve a given input and the previous one (with projectId, formId, entityId & period)
 */
router.get('/resources/input', async ctx => {
	const q = ctx.request.query;

	if (q.mode && q.mode.startsWith('ids_by_')) {
		let ids;
		if (q.mode === 'ids_by_form')
			ids = await Input.storeInstance.listIdsByDataSource(q.projectId, q.formId, true);
		else
			throw new Error('invalid_mode');

		ctx.response.body = ids.filter(id => ctx.visibleProjectIds.has(id.substr(6, 44)));
	}
	else {
		let inputs;
		if (q.mode === 'current+last')
			inputs = await Input.storeInstance.getLasts(q.projectId, q.formId, q.entityId, q.period, true);
		else if (q.mode === undefined && typeof q.projectId === 'string')
			inputs = await Input.storeInstance.listByProject(q.projectId, true);
		else if (q.mode === undefined)
			inputs = await Input.storeInstance.list(true);
		else
			throw new Error('invalid_mode');

		ctx.response.body = inputs
			.filter(input => ctx.visibleProjectIds.has(input.project))
			.map(input => input.toAPI());
	}
});


/**
 * Retrieve one input by id
 */
router.get('/resources/input/:id', async ctx => {
	const input = await Input.storeInstance.get(ctx.params.id);

	// Update the input before sending
	const project = await Project.storeInstance.get(input.project);
	input.update(project.getDataSourceById(input.form).structure);

	// Check if user is allowed (lazy way).
	if (!ctx.visibleProjectIds.has(input.project))
		throw new Error('forbidden');

	ctx.response.body = input.toAPI();
});


/**
 * Save an input
 */
router.put('/resources/input/:id', async ctx => {
	// Validate that the _id in the payload is the same as the id in the URL.
	if (ctx.request.body._id !== ctx.params.id)
		throw new Error('id_mismatch');

	const input = new Input(ctx.request.body);
	const project = await Project.storeInstance.get(input.project);

	// Check ACLs
	var projectUser = project.getProjectUser(ctx.state.user),
		projectRole = project.getRole(ctx.state.user);

	var allowed =
		(projectRole === 'owner') ||
		(projectRole === 'input' && projectUser.entities.includes(input.entity) && projectUser.dataSources.includes(input.form));

	if (!allowed)
		throw new Error('forbidden');

	cache.del('reporting:project:' + input.project);

	await input.save();
	ctx.response.body = input.toAPI();
})

/**
 * Delete an input.
 */
router.delete('/resources/input/:id', async ctx => {
	const input = await Input.storeInstance.get(ctx.params.id);
	const project = await Project.storeInstance.get(input.project);

	// Check ACLs
	var projectUser = project.getProjectUser(ctx.state.user),
		projectRole = project.getRole(ctx.state.user);

	var allowed = false;
	if (projectRole === 'owner')
		allowed = true;
	else if (projectRole === 'input' && projectUser.entities.indexOf(input.entity) !== -1 && projectUser.dataSources.indexOf(input.form) !== -1)
		allowed = true;

	if (!allowed)
		throw new Error('forbidden');

	cache.del('reporting:project:' + input.project);

	ctx.response.body = input.destroy();
})

/**
 * List indicators, themes, users
 * (Those are public data).
 */
router.get('/resources/:modelName(indicator|theme|user)', async ctx => {
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];

	const models = await Model.storeInstance.list();
	ctx.response.body = models.map(m => m.toAPI());
})

/**
 * Get an indicator, theme or user.
 */
router.get('/resources/:modelName(indicator|theme|user)/:id', async ctx => {
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];

	const model = Model.storeInstance.get(ctx.params.id);
	ctx.response.body = model.toAPI();
})

/**
 * Save an indicator, theme or user (need to be admin).
 */
router.put('/resources/:modelName(indicator|theme|user)/:id', async ctx => {
	// Only admin accounts can touch indicators, themes and users.
	if (ctx.state.user.role !== 'admin')
		throw new Error('forbidden');

	// Validate that the _id in the payload is the same as the id in the URL.
	if (ctx.request.body._id !== ctx.params.id)
		throw new Error('id_mismatch');

	// Save the model.
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];
	const model = new Model(ctx.request.body);
	model.save();

	ctx.response.body = model.toAPI();
})

/**
 * Delete an indicator, theme or user (need to be admin).
 */
router.delete('/resources/:modelName(indicator|theme)/:id', async ctx => {
	// Only admin accounts can touch indicators, themes and users.
	if (ctx.state.user.role !== 'admin')
		throw new Error('forbidden');

	// Save the model.
	const Model = {indicator: Indicator, theme: Theme, user: User}[ctx.params.modelName];
	const model = await Model.storeInstance.get(ctx.params.id);

	ctx.response.body = model.destroy()
});


export default router;