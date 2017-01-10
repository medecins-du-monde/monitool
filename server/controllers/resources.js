"use strict";

var express     = require('express'),
	passport    = require('../authentication/passport'),
	AccessToken = require('../models/authentication/access-token'),
	Client      = require('../models/authentication/client'),
	User        = require('../models/authentication/user'),
	Indicator   = require('../models/resources/indicator'),
	Input       = require('../models/resources/input'),
	Project     = require('../models/resources/project'),
	Theme       = require('../models/resources/theme');

var bodyParser = require('body-parser').json();



module.exports = express.Router()

	.use(function(request, response, next) {
		// Check that user is properly authenticated with a cookie.
		// and that it's really a user, not a client that found a way to get a cookie.
		if (request.isAuthenticated && request.isAuthenticated() && request.user && (request.user.type === 'user' || request.user.type === 'partner'))
			next();
		else {
			passport.authenticate('user_accesstoken', {session: false}, function(error, user, info) {
				// FIXME: not sure what this does 2 years after, only real users can have accesstokens?
				if (user && user.type === 'user') {
					request.user = user;
					next();
				}
				else
					response.status(401).json({
						error: "credentials_required",
						message: "Please provide either session cookie or an access token."
					});
			})(request, response, next);
		}
	})

	.get('/myself', function(request, response) {
		response.json(request.user || null);
	})

	///////////////////////////////////////////
	// Special cases: projects and inputs
	///////////////////////////////////////////

	.get('/project', function(request, response) {
		var promise;
		if (request.user.type === 'user' && request.query.mode === 'short')
			promise = Project.storeInstance.listShort(request.user._id);

		else {
			if (request.query.mode === 'crossCutting')
				promise = Project.storeInstance.listByIndicator(request.query.indicatorId, true);
			else if (request.query.mode === undefined)
				promise = Project.storeInstance.list();
			else
				promise = Promise.reject(new Error('invalid_mode'));
			
			// Filter projects for partners.
			if (request.user.type === 'partner')
				promise = promise.then(function(projects) {
					return projects.filter(p => p._id === request.user.projectId);
				});

			// listShort, listByIndicator and list require a post processing step
			// to hide passwords (which is not the case for listShort)
			promise = promise.then(function(projects) {
				return projects.map(p => p.toAPI());
			});
		}

		promise.then(
			function(projectsData) {
				response.json(projectsData);
			},
			response.jsonError
		);
	})

	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id != request.user.projectId)
			return response.jsonError(new Error('forbidden'));

		Project.storeInstance.get(request.params.id)
			.then(function(project) {
				response.json(project.toAPI());
			})
			.catch(response.jsonError)
	})

	.put('/project/:id', bodyParser, function(request, response) {
		// Validate that the _id in the payload is the same as the id in the URL.
		if (request.body._id !== request.params.id || request.body.type !== 'project')
			return response.status(400).json({error: true, message: 'id must match with URL'});

		var canSavePromise = Project.storeInstance.get(request.params.id).then(
			function(project) {
				// We override a project
				return 'owner' === project.getRole(request.user);
			},
			function(error) {
				var u = request.user;
				if (error.message === 'missing')
					// Create a new project
					return u.type === 'user' && (u.role === 'admin' || u.role === 'project');
				// Other error (trying to override an indicator with a project?).
				return false;
			}
		);

		canSavePromise.then(function(canSave) {
			if (!canSave)
				return response.status(403).json({error: true, message: 'forbidden'});
			
			var newProject = new Project(response.body);
			newProject.save().then(
				function(project) {
					response.json(p);
				},
				response.jsonError
			);
		});
	})

	.delete('/project/:id', bodyParser, function(request, response) {
		// Partners cannot delete projects (that would be deleting themselves).
		if (request.user.type !== 'user')
			return response.status(403).json({error: true, message: 'forbidden'});

		Project.storeInstance.get(request.params.id)
			.then(function(project) {
				// Ask the project if it is deletable.
				if (project.getRole(request.user) !== 'owner')
					throw new Error("forbidden");

				return project.destroy();
			})
			.then(
				// project was destroyed
				function() {
					response.json({});
				},
				// manages errors from both storeInstance.get and acl check.
				response.jsonError
			);
	})

	.get('/input', function(request, response) {
		var q = request.query;

		// If user is a partner, force him to have a projectId filter.
		if (request.user.type === 'partner') {
			// User if trying to access forbidden ressources.
			if (typeof q.projectId === 'string' && q.projectId !== request.user.projectId)
				return response.jsonError(new Error('forbidden'));
			
			q.projectId = request.user.projectId;
		}

		var promise;
		if (q.mode === 'ids_by_form' || q.mode === 'ids_by_entity') {
			if (q.mode === 'ids_by_form')
				promise = Input.storeInstance.listIdsByDataSource(q.projectId, q.formId);
			else // mode === 'ids_by_entity'
				promise = Input.storeInstance.listIdsByEntity(q.projectId, q.entityId);
		}
		else {
			if (q.mode === 'current+last')
				promise = Input.storeInstance.getLasts(q.projectId, q.formId, q.entityId, q.period);
			else if (q.mode !== undefined)
				promise = Promise.reject(new Error('invalid_mode'));
			else if (typeof q.projectId === 'string')
				promise = Input.storeInstance.listByProject(q.projectId);
			else
				promise = Input.storeInstance.list(); // get all from all projects, never happens for partners.
		}

		promise.then(
			function(data) {
				response.json(data);
			},
			response.jsonError
		);
	})

	.get('/input/:id', function(request, response) {
		var projectId = request.params.id.split(':')[0];
		if (request.user.type === 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));

		Input.storeInstance.get(request.params.id)
			.then(function(input) {
				response.json(input);
			})
			.catch(response.jsonError);
	})

	.put('/input/:id', bodyParser, function(request, response) {
		var projectId = request.params.id.split(':')[0];
		if (request.user.type === 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));


	})

	.delete('/input/:id', function(request, response) {
		var projectId = request.params.id.split(':')[0];
		if (request.user.type === 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));

		Promise.all([Project.storeInstance.get(projectId), Input.storeInstance.get(request.params.id)])
			.then(function(res) {
				var project = res[0], input = res[1];

				throw new Error('Implement me!');




				if (project.getRole(request.user) !== 'owner')
					throw new Error('forbidden');

				return input.destroy();
			})
			.then(
				function() {
					response.json({});
				},
				response.jsonError
			);
	})

	///////////////////////////////////////////
	// General case
	///////////////////////////////////////////

	// list
	.get('/:modelName(indicator|theme|user)', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.list()
			.then(function(models) {
				response.json(models);
			})
			.catch(response.jsonError);
	})

	// get item
	.get('/:modelName(indicator|theme|user)/:id', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id)
			.then(function(model) {
				response.json(model);
			})
			.catch(response.jsonError);
	})

	.put('/:modelName(indicator|theme|user)/:id', bodyParser, function(request, response) {
		// Only admin accounts can touch indicators, themes and users.
		if (request.user.role !== 'admin')
			return response.jsonError(new Error('forbidden'));

		// Save the model.
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		var model;
		try {
			model = new Model(request.body);

			model.save().then(
				function(model) {
					response.json(model);
				},
				response.jsonError
			);
		}
		catch (e) {
			return response.jsonError(e);
		}
	})

	.delete('/:modelName(indicator|input|theme)/:id', bodyParser, function(request, response) {
		// Only admin accounts can touch indicators, themes and users.
		if (request.user.role !== 'admin')
			return response.status(403).json({error: true, message: 'forbidden'});

		// Save the model.
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id)
			.then(function(model) {
				return model.destroy();
			})
			.then(
				function() {
					response.json({});
				},
				response.jsonError
			);
	});

