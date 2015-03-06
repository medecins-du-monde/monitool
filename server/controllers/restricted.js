"use strict";

var express   = require('express'),
	crypto    = require('crypto'),
	Indicator = require('../models/indicator'),
	Input     = require('../models/input'),
	Report    = require('../models/report'),
	Project   = require('../models/project'),
	Theme     = require('../models/theme'),
	Type      = require('../models/type'),
	User      = require('../models/user'),
	router    = express.Router();

var ModelsByName = {indicator: Indicator, input: Input, report: Report, project: Project, theme: Theme, type: Type, user: User};

router.use(require('body-parser').json());

// FIXME, we should not allow creating users.
var checkEditPermissions = function(user, modelName, modelId, callback) {
	if (user.roles.indexOf('_admin') !== -1)
		// admins can do what they want
		callback(null);

	else if (["project", "input"].indexOf(modelName) !== -1)
		// project permissions are located on the project itself
		Project.get(modelId, function(error, project) {
			if (error === 'not_found')
				// check if the user is allowed to create projects
				callback(user.roles.indexOf('project') === -1 ? 'missing_permission' : null);
			else if (error === 'type') {
				// user is crafting this query to see if it can overwrite a type with a project?
				callback('uuid_must_be_unique_across_types');
			}
			else {
				// check if the user is allowed to update this particular project
				var allowerUsers = modelName === 'project' ? project.owners : project.dataEntryOperators;
				callback(allowerUsers.indexOf(user._id) === -1 ? 'missing_permission' : null);
			}
		});

	else if (["indicator", "theme", "type"].indexOf(modelName) !== -1)
		// users need a role for indicators
		callback(user.roles.indexOf('indicator') === -1 ? 'missing_permission' : null);

	else
		callback('missing_permission');
};

router.put('/:modelName(indicator|project|input|report|theme|type|user)/:id', function(request, response) {
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
});

router.delete('/:modelName(indicator|project|input|report|theme|type|user)/:id', function(request, response) {
	var modelName = request.params.modelName;

	checkEditPermissions(request.user, modelName, request.params.id, function(error) {
		if (error)
			return response.status(403).json({error: true, detail: error});

		var ModelClass = ModelsByName[modelName];

		ModelClass.delete(request.params.id, function(error) {
			if (error)
				response.status(400).json({error: true, message: "Can't do."});
			else
				response.json({error: false, message: "The item was deleted."});
		});
	});
});


module.exports = router;
