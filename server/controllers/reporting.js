"use strict";

var async = require('async'),
	express = require('express'),
	Input   = require('../models/resources/input'),
	Project = require('../models/resources/project'),
	CubeCollection = require('../olap/cube-collection');


module.exports = express.Router()

	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id != request.user.projectId)
			return response.status(404).json({error: true, message: "Not Found"});

		Project.get(request.params.id, function(error, project) {
			Input.list({mode: "project_inputs", projectId: request.params.id}, function(error, inputs) {
				response.json({
					type: 'cubes',
					projectId: project._id,
					cubes: CubeCollection.fromProject(project, inputs).serialize()
				});
			});
		});
	})

	.get('/indicator/:id', function(request, response) {
		if (request.user.type == 'partner')
			return response.status(403).json({error: true, message: "Forbidden"});

		Project.list({mode: "crossCutting", indicatorId: request.params.id}, function(error, projects) {
			var inputsQueries = projects.map(function(p) { return {mode: 'project_inputs', projectId: p._id}; });

			async.map(inputsQueries, Input.list, function(error, inputsByProject) {
				var result = {};
				for (var i = 0; i < projects.length; ++i) {
					var project = projects[i], inputs = inputsByProject[i];
					result[project._id] = CubeCollection.fromProject(project, inputs).serialize();
				}

				response.json({type: 'cubes', cubes: result});
			});
		});
	});

