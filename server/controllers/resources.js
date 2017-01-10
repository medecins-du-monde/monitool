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
				promise = promise.then(projects => projects.filter(p => p._id === request.user.projectId));

			// listShort, listByIndicator and list require a post processing step
			// to hide passwords (which is not the case for listShort)
			promise = promise.then(projects => projects.map(p => p.toAPI()))
		}

		promise.then(response.jsonPB, response.jsonErrorPB);
	})
	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));
		
		Project.storeInstance.get(request.params.id)
			.then(p => p.toAPI())
			.then(response.jsonPB, response.jsonErrorPB);
	})

	.put('/project/:id', bodyParser, function(request, response) {
		// Validate that the _id in the payload is the same as the id in the URL.
		if (request.body._id !== request.params.id)
			return response.jsonError(new Error('id_mismatch'));

		// Get old project to check ACLS
		Project.storeInstance.get(request.params.id)
			.then(
				// project was found, we raise an error if user is not allowed, otherwise we return the project.
				function(project) {
					if ('owner' !== project.getRole(request.user))
						throw new Error('forbidden');
				},
				// project was not found, we check if user can create projects, and raise error otherwise
				// if the error was something else, reraise it.
				function(error) {
					var u = request.user;
					if (error.message === 'missing' && !(u.type === 'user' && (u.role === 'admin' || u.role === 'project')))
						throw new Error('forbidden'); // Cannot create project
					else if (error.message !== 'missing')
						throw error; // any other database error.
				}
			)
			.then(function() {
				return new Project(response.body).save();
			})
			.then(response.jsonPB, response.jsonErrorPB);
	})

	.delete('/project/:id', bodyParser, function(request, response) {
		// Partners cannot delete projects (that would be deleting themselves).
		if (request.user.type !== 'user')
			return response.jsonError(new Error('forbidden'));
		
		Project.storeInstance.get(request.params.id).then(function(project) {
			// Ask the project if it is deletable.
			if (project.getRole(request.user) !== 'owner')
				throw new Error("forbidden");

			return project.destroy();
		}).then(response.jsonPB, response.jsonErrorPB);
	})

	.get('/input', function(request, response) {
		var promise, q = request.query;

		// If user is a partner, force him to have a projectId filter.
		if (request.user.type === 'partner') {
			// User if trying to access forbidden ressources.
			if (typeof q.projectId === 'string' && q.projectId !== request.user.projectId)
				return response.jsonError(new Error('forbidden'));
			
			q.projectId = request.user.projectId;
		}

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

		promise.then(response.jsonPB, response.jsonErrorPB);
	})

	.get('/input/:id', function(request, response) {
		var projectId = request.params.id.split(':')[0];
		if (request.user.type === 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));

		Input.storeInstance.get(request.params.id).then(response.jsonPB, response.jsonErrorPB);
	})

	.put('/input/:id', bodyParser, function(request, response) {
		// Validate that the _id in the payload is the same as the id in the URL.
		if (request.body._id !== request.params.id)
			return response.jsonError(new Error('id_mismatch'));

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
			.then(response.jsonPB, response.jsonErrorPB);
	})

	///////////////////////////////////////////
	// General case
	///////////////////////////////////////////

	// list
	.get('/:modelName(indicator|theme|user)', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.list().then(response.jsonPB, response.jsonErrorPB);
	})

	// get item
	.get('/:modelName(indicator|theme|user)/:id', function(request, response) {
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id).then(response.jsonPB, response.jsonErrorPB);
	})

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
			model.save().then(response.jsonPB, response.jsonErrorPB);
		}
		catch (e) {
			return response.jsonError(e);
		}
	})

	.delete('/:modelName(indicator|input|theme)/:id', bodyParser, function(request, response) {
		// Only admin accounts can touch indicators, themes and users.
		if (request.user.role !== 'admin')
			return response.jsonError(new Error('forbidden'));

		// Save the model.
		var ModelsByName = {indicator: Indicator, theme: Theme, user: User},
			Model = ModelsByName[request.params.modelName];

		Model.storeInstance.get(request.params.id)
			.then(function(model) {
				return model.destroy();
			})
			.then(response.jsonPB, response.jsonErrorPB);
	});
