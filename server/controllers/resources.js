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

var ModelsByName = {indicator: Indicator, input: Input, project: Project, theme: Theme, user: User},
	bodyParser   = require('body-parser').json();


// All routes here should be protected behind a bearer token
var checkEditPermissions = function(realUser, modelName, modelId, callback) {
	// Only users and partner can access those resources (Clients need to inpersonate a user, and can only access oauth routes).
	if (realUser.type !== 'user' && realUser.type !== 'partner')
		return callback('not_a_user');

	// Admins can do what they please
	if (realUser.type === 'user' && realUser.role === 'admin')
		return callback(null);

	// General case.
	if (modelName === "project") {
		// project permissions are located on the project itself
		Project.get(modelId, function(error, project) {
			if (error === 'not_found') {
				if (realUser.type === 'user') {
					// check if the user is allowed to create projects
					if (realUser.role === 'project')
						return callback(null);
					else
						return callback('missing_permission');
				}
				else
					return callback('missing_permission');
			}
			else if (error === 'type')
				// user is crafting this query to see if it can overwrite a type with a project?
				return callback('uuid_must_be_unique_across_types');
			
			else if (error)
				return callback('other_error');

			else {
				// check if the user is allowed to update this particular project
				if (realUser.type == 'user') {
					if (project.users.filter(function(u) { return u.type == 'internal' && u.role == 'owner' && u.id == realUser._id; }).length)
						return callback(null);
					else
						return callback('user_not_is_allowed_list');
				}
				else if (realUser.type == 'partner') {
					if (project.users.filter(function(u) { return u.type == 'partner' && u.role == 'owner' && u.username == realUser.username; }).length)
						return callback(null);
					else
						return callback('partner_not_is_allowed_list');
				}
			}
		});
	}

	else if (modelName == "input") {
		var id = modelId.split(':'), projectId = id[0], entityId = id[1];

		Project.get(projectId, function(error, project) {
			if (error)
				return callback('could_not_retrieve_project');

			// Retrieve projectUser from project.
			var projectUsers, projectUser;
			if (realUser.type == 'user')
				projectUsers = project.users.filter(function(u) { return u.type == 'internal' && u.id == realUser._id; });
			else if (realUser.type == 'partner')
				projectUsers = project.users.filter(function(u) { return u.type == 'partner' && u.username == realUser.username; });
			else
				throw new Error('invalid user type');
			projectUser = projectUsers.length ? projectUsers[0] : null;

			// Check permissions.
			if (projectUser) {
				if (projectUser.role == 'owner' || projectUser.role == 'input_all')
					return callback(null);
				else if (projectUser.role == 'input' && projectUser.entities.indexOf(entityId) !== -1)
					return callback(null);
				else
					return callback('not_allowed');
			}
			else
				return callback('not_associated_with_project');
		});
	}

	else
		return callback('admins_only');
};


module.exports = express.Router()

	.use(function(request, response, next) {
		// we check that user is properly authenticated with a cookie.
		// and that it's really a user, not a client that found a way to get a cookie.
		if (request.isAuthenticated && request.isAuthenticated() && request.user && (request.user.type === 'user' || request.user.type === 'partner'))
			next();
		else {
			passport.authenticate('user_accesstoken', {session: false}, function(error, user, info) {
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
	
	// list projects
	.get('/project', function(request, response) {
		if (request.user.type == 'user')
			Project.list(request.query, function(error, data) {
				if (error)
					response.json({error: true, message: error});
				else
					response.json(data);
			});

		else if (request.user.type == 'partner')
			Project.get(request.user.projectId, function(error, data) {
				if (error)
					response.json({error: true, message: error});
				else
					response.json([data]);
			});

		else
			throw new Error();
	})

	// get projects
	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id != request.user.projectId)
			return response.status(404).json({error: true, message: "Not Found"});

		Project.get(request.params.id, function(error, data) {
			if (error) {
				if (error === 'not_found')
					return response.status(404).json({error: true, message: "Not Found"});
				else
					return response.status(500).json({error: true, message: "Server"});
			}

			response.json(data);
		});
	})

	// list inputs
	.get('/input', function(request, response) {
		var options = request.query;
		if (request.user.type == 'partner')
			options.restrictProjectId = request.user.projectId;

		Input.list(options, function(error, data) {
			if (error)
				response.json({error: true, message: error});
			else {
				response.json(data);
			}
		});
	})

	// get item
	.get('/input/:id', function(request, response) {
		var projectId = request.params.id.split(':')[0];
		if (request.user.type == 'partner' && request.params.id !== request.user.projectId)
			return response.status(404).json({error: true, message: "Not Found"});

		Input.get(request.params.id, function(error, data) {
			if (error) {
				if (error === 'not_found')
					return response.status(404).json({error: true, message: "Not Found"});
				else
					return response.status(500).json({error: true, message: "Server"});
			}

			response.json(data);
		});
	})

	///////////////////////////////////////////
	// General case
	///////////////////////////////////////////

	// list
	.get('/:modelName(indicator|theme|type|user)', function(request, response) {
		var Model = ModelsByName[request.params.modelName];

		Model.list(request.query, function(error, data) {
			if (error)
				response.json({error: true, message: error});
			else
				response.json(data);
		});
	})

	// get item
	.get('/:modelName(indicator|theme|type|user)/:id', function(request, response) {
		var Model = ModelsByName[request.params.modelName];

		Model.get(request.params.id, function(error, data) {
			if (error) {
				if (error === 'not_found')
					return response.status(404).json({error: true, message: "Not Found"});
				else
					return response.status(500).json({error: true, message: "Server"});
			}

			response.json(data);
		});
	})

	// .get('/client', function(request, response) {
	// 	Client.list({}, function(error, clients) {
	// 		AccessToken.list({}, function(error, accessTokens) {
	// 			// SLOW!
				
	// 			clients.forEach(function(c) { c.__numUserTokens = 0; c.__numTokens = 0; });
	// 			if (request.user.roles.indexOf('_admin') === -1)
	// 				clients.forEach(function(c) { delete c.secret; });

	// 			accessTokens.forEach(function(accessToken) {
	// 				clients.forEach(function(c) {
	// 					if (accessToken.clientId === c._id) {
	// 						if (accessToken.userId === request.user._id)
	// 							c.__numUserTokens++;
	// 						c.__numTokens++;
	// 					}
	// 				});
	// 			});

	// 			response.json(clients);
	// 		})
	// 	});
	// })

	// .get('/client/:id', function(request, response) {
	// 	Client.get(request.params.id, function(error, client) {
	// 		if (request.user.roles.indexOf('_admin') === -1)
	// 			delete client.secret;

	// 		response.json(client);
	// 	});
	// })

	.put('/:modelName(indicator|project|input|theme|type|user)/:id', bodyParser, function(request, response) {
		var modelName  = request.params.modelName,
			ModelClass = ModelsByName[request.params.modelName],
			newModel   = request.body;

		// check submission against schema + check dependencies
		ModelClass.validate(newModel, function(errors) {
			if (errors && errors.length)
				return response.status(400).json({error: true, detail: errors});

			// check that the user did not craft a query playing with no DRY data to skip acls. Don't remove this!
			if (newModel._id !== request.params.id || newModel.type !== modelName)
				return response.status(400).json({error: true, detail: [{field: '_id', message: 'id must match with URL'}]});

			// FIXME => make sure we are not overwriting something...

			// check user permissions
			checkEditPermissions(request.user, modelName, request.params.id, function(error) {
				if (error)
					return response.status(403).json({error: true, detail: error});

				// update
				ModelClass.set(newModel, function(error, result) {
					if (error)
						return response.status(500).json({error: true, detail: "Could not save. Try again"});

					newModel._rev = result.rev;
					return response.json(newModel);
				});
			});
		});
	})

	.delete('/:modelName(indicator|project|input|theme|type)/:id', bodyParser, function(request, response) {
		var modelName = request.params.modelName;

		checkEditPermissions(request.user, modelName, request.params.id, function(error) {
			if (error)
				return response.status(403).json({error: true, detail: error});

			ModelsByName[modelName].delete(request.params.id, function(error) {
				if (error)
					response.status(400).json({error: true, message: "Can't do."});
				else
					response.json({error: false, message: "The item was deleted."});
			});
		});
	});

