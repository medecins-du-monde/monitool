"use strict";

var express     = require('express'),
	passport    = require('../authentication/passport'),
	AccessToken = require('../models/authentication/access-token'),
	Client      = require('../models/authentication/client'),
	User        = require('../models/authentication/user'),
	Indicator   = require('../models/resources/indicator'),
	Input       = require('../models/resources/input'),
	Report      = require('../models/resources/report'),
	Project     = require('../models/resources/project'),
	Theme       = require('../models/resources/theme'),
	Type        = require('../models/resources/type');

var ModelsByName = {indicator: Indicator, input: Input, report: Report, project: Project, theme: Theme, type: Type, user: User},
	bodyParser   = require('body-parser').json();


// All routes here should be protected behind a bearer token
var checkEditPermissions = function(user, modelName, modelId, callback) {
	if (user.type !== 'user' && user.type !== 'partner')
		callback('not_a_user');

	if (user.type === 'user' && user.roles.indexOf('_admin') !== -1)
		// admins can do what they want
		callback(null);

	else if (modelName === "project")
		// project permissions are located on the project itself
		Project.get(modelId, function(error, project) {
			if (error === 'not_found')
				// check if the user is allowed to create projects
				callback(user.roles.indexOf('project') === -1 ? 'missing_permission' : null);

			else if (error === 'type')
				// user is crafting this query to see if it can overwrite a type with a project?
				callback('uuid_must_be_unique_across_types');
			
			else {
				// check if the user is allowed to update this particular project
				if (user.type == 'user') {
					if (project.users.filter(function(u) { return u.role == 'owner' && u.id == user._id; }).length)
						callback(null);
					else
						callback('user_not_is_allowed_list');
				}
				else if (user.type == 'partner') {
					if (project.users.filter(function(u) { return u.role == 'owner' && u.username == user.username; }).length)
						callback(null);
					else
						callback('partner_not_is_allowed_list');
				}
			}
		});

	else if (["input", "report"].indexOf(modelName) !== -1) {
		// FIXME! Security hole
		callback(null)
	}

	else if (["indicator", "theme", "type"].indexOf(modelName) !== -1)
		// users need a role for indicators
		callback(user.roles.indexOf('indicator') === -1 ? 'missing_permission' : null);

	else
		callback('missing_permission');
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


	.get('/:modelName(project|indicator|input|report|theme|type|user)', function(request, response) {
		var Model = ModelsByName[request.params.modelName];

		Model.list(request.query, function(error, data) {
			if (error)
				response.json({error: true, message: error});
			else
				response.json(data);
		});
	})

	.get('/:modelName(project|indicator|input|report|theme|type|user)/:id', function(request, response) {
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

	.put('/:modelName(indicator|project|input|report|theme|type|user)/:id', bodyParser, function(request, response) {
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

	.delete('/:modelName(indicator|project|input|report|theme|type)/:id', bodyParser, function(request, response) {
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

