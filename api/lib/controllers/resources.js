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
import User from '../resource/model/user';
import Indicator from '../resource/model/indicator';
import Input from '../resource/model/input';
import Project from '../resource/model/project';
import Theme from '../resource/model/theme';
import bodyParserModule from 'body-parser';


const bodyParser = bodyParserModule.json({limit: '1mb'});

export default express.Router()

	/**
	 * Get current logged in account information
	 * This is used by the client to check if current session is valid and learn user name for display purposes.
	 */
	.get('/myself', function(request, response) {
		response.json(request.user || null);
	})

	/**
	 * Retrieve multiple projects.
	 *
	 * Multiple modes are supported
	 * 		- no parameter: Retrieve all projects.
	 *		- ?mode=short: Retrieve all projects (only country, name, themes, and current user).
	 *		- ?mode=crossCutting&indicatorId=123: Retrieve projects that collect indicator 123 (bare minimum to compute indicator from cubes).
	 */
	.get('/project', function(request, response) {
		Promise.resolve().then(async () => {
			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);

			let projects;
			if (request.user.type === 'user' && request.query.mode === 'short')
				projects = await Project.storeInstance.listShort(request.user._id);

			else {
				if (request.query.mode === 'crossCutting')
					projects = await Project.storeInstance.listByIndicator(request.query.indicatorId, true);
				else if (request.query.mode === undefined)
					projects = await Project.storeInstance.list();
				else
					throw new Error('invalid_mode');

				// listShort, listByIndicator and list require a post processing step
				// to hide passwords (which is not the case for listShort)
				projects = projects.map(p => p.toAPI())
			}

			// Filter projects depending on ACL.
			projects = projects.filter(p => visibleIds.indexOf(p._id) !== -1);

			return projects;
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Retrieve one project
	 */
	.get('/project/:id', function(request, response) {
		Promise.resolve().then(async () => {
			const project = await Project.storeInstance.get(request.params.id);

			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);
			if (visibleIds.indexOf(request.params.id) === -1)
				throw new Error('forbidden');

			return project.toAPI();
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Retrieve one project
	 */
	.get('/project/:id/revisions', function(request, response) {
		Promise.resolve().then(async () => {
			const revisions = await Project.storeInstance.listRevisions(request.params.id, request.query.offset, request.query.limit);

			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);
			if (visibleIds.indexOf(request.params.id) === -1)
				throw new Error('forbidden');

			return revisions;
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})


	/**
	 * Save a project
	 */
	.put('/project/:id', bodyParser, function(request, response) {
		Promise.resolve().then(async () => {
			// Validate that the _id in the payload is the same as the id in the URL.
			if (request.body._id !== request.params.id)
				throw new Error('id_mismatch');

			// Get old project
			let oldProject = null;
			try {
				oldProject = await Project.storeInstance.get(request.params.id);
			}
			catch (error) {
				if (error.message !== 'missing')
					throw error;
			}

			// Check ACLS
			if (oldProject) {
				// This is a project update, we need to make sure that user is owner.
				if ('owner' !== oldProject.getRole(request.user))
					throw new Error('forbidden');
			}
			else {
				// This is a project creation, make sure that user is not a partner and has permission.
				let u = request.user;
				let isAllowed = u.type === 'user' && (u.role === 'admin' || u.role === 'project');
				if (!isAllowed)
					throw new Error('forbidden');
			}

			// Create the project.
			cache.del('reporting:project:' + request.params.id); // This empties the reporting cache

			const newProject = new Project(request.body);
			await newProject.save();

			return newProject.toAPI();
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Delete a project
	 */
	.delete('/project/:id', function(request, response) {
		Promise.resolve().then(async () => {
			// Partners cannot delete projects (that would be deleting themselves).
			if (request.user.type !== 'user')
				throw new Error('forbidden');

			const project = await Project.storeInstance.get(request.params.id);

			// Ask the project if it is deletable.
			if (project.getRole(request.user) !== 'owner')
				throw new Error("forbidden");

			cache.del('reporting:project:' + request.params.id);

			return project.destroy();

		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Retrieve a list of inputs, or inputs ids.
	 *
	 * Multiple modes are supported
	 * 		- ids_by_form: retrieve all input ids that match a given projectId and formId
	 *		- ids_by_entity: retrieve all inputs ids that match a given projectId and entityId
	 * 		- current+last: retrieve a given input and the previous one (with projectId, formId, entityId & period)
	 */
	.get('/input', function(request, response) {
		Promise.resolve().then(async () => {
			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);
			const q = request.query;

			if (q.mode && q.mode.startsWith('ids_by_')) {
				let ids;
				if (q.mode === 'ids_by_form')
					ids = await Input.storeInstance.listIdsByDataSource(q.projectId, q.formId);
				else if (q.mode === 'ids_by_entity')
					ids = await Input.storeInstance.listIdsByEntity(q.projectId, q.entityId);
				else
					throw new Error('invalid_mode');

				return ids.filter(id => visibleIds.indexOf(id.substr(6, 44)) !== -1);
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

				return inputs
					.filter(input => visibleIds.indexOf(input.project) !== -1)
					.map(input => input.toAPI());
			}
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Retrieve one input by id
	 */
	.get('/input/:id', function(request, response) {
		Promise.resolve().then(async () => {
			const input = await Input.storeInstance.get(request.params.id);

			// Update the input before sending
			const project = await Project.storeInstance.get(input.project);
			input.update(project.getDataSourceById(input.form).structure);

			// Check if user is allowed (lazy way).
			const visibleIds = await Project.storeInstance.listVisibleIds(request.user);
			if (visibleIds.indexOf(input.project) === -1)
				throw new Error('forbidden');

			return input.toAPI();
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Save an input
	 */
	.put('/input/:id', bodyParser, function(request, response) {
		Promise.resolve().then(async () => {
			// Validate that the _id in the payload is the same as the id in the URL.
			if (request.body._id !== request.params.id)
				throw new Error('id_mismatch');

			const input = new Input(request.body);
			const project = await Project.storeInstance.get(input.project);

			// Check ACLs
			var projectUser = project.getProjectUser(request.user),
				projectRole = project.getRole(request.user);

			var allowed = false;
			if (projectRole === 'owner')
				allowed = true;
			else if (projectRole === 'input' && projectUser.entities.indexOf(input.entity) !== -1 && projectUser.dataSources.indexOf(input.form) !== -1)
				allowed = true;

			if (!allowed)
				throw new Error('forbidden');

			cache.del('reporting:project:' + input.project);

			return input.save();
		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Delete an input.
	 */
	.delete('/input/:id', function(request, response) {
		Promise.resolve().then(async () => {
			const input = await Input.storeInstance.get(request.params.id);
			const project = await Project.storeInstance.get(input.project);

			// Check ACLs
			var projectUser = project.getProjectUser(request.user),
				projectRole = project.getRole(request.user);

			var allowed = false;
			if (projectRole === 'owner')
				allowed = true;
			else if (projectRole === 'input' && projectUser.entities.indexOf(input.entity) !== -1 && projectUser.dataSources.indexOf(input.form) !== -1)
				allowed = true;

			if (!allowed)
				throw new Error('forbidden');

			cache.del('reporting:project:' + input.project);

			return input.destroy();

		}).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * List indicators, themes, users
	 * (Those are public data).
	 */
	.get('/:modelName(indicator|theme|user)', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.list().then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Get an indicator, theme or user.
	 */
	.get('/:modelName(indicator|theme|user)/:id', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id).then(response.jsonPB).catch(response.jsonErrorPB);
	})

	/**
	 * Save an indicator, theme or user (need to be admin).
	 */
	.put('/:modelName(indicator|theme|user)/:id', bodyParser, function(request, response) {
		// Only admin accounts can touch indicators, themes and users.
		if (request.user.role !== 'admin')
			return response.jsonError(new Error('forbidden'));

		// Validate that the _id in the payload is the same as the id in the URL.
		if (request.body._id !== request.params.id)
			return response.jsonError(new Error('id_mismatch'));

		// Save the model.
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		var model;
		try {
			model = new Model(request.body);
			model.save().then(response.jsonPB).catch(response.jsonErrorPB);
		}
		catch (e) {
			return response.jsonError(e);
		}
	})

	/**
	 * Delete an indicator, theme or user (need to be admin).
	 */
	.delete('/:modelName(indicator|theme)/:id', bodyParser, function(request, response) {
		// Only admin accounts can touch indicators, themes and users.
		if (request.user.role !== 'admin')
			return response.jsonError(new Error('forbidden'));

		// Save the model.
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id)
			.then(model => model.destroy())
			.then(response.jsonPB)
			.catch(response.jsonErrorPB);
	});
