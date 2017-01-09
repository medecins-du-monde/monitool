"use strict";

var express = require('express'),
	Input   = require('../models/resources/input'),
	Project = require('../models/resources/project'),
	CubeCollection = require('../olap/cube-collection');

module.exports = express.Router()

	.get('/project/:id', function(request, response) {
		if (request.user.type == 'partner' && request.params.id != request.user.projectId)
			return response.status(404).json({error: true, message: "Not Found"});

		Promise
			.all([
				Project.storageInstance.get(request.params.id),
				Input.storageInstance.listByProject(request.params.id)
			])
			.then(
				function(results) {
					response.json({
						error: false,
						type: 'cubes',
						projectId: results[0]._id,
						cubes: CubeCollection.fromProject(results[0], results[1]).serialize()
					});
				},
				function(error) {
					reponse.json({error: true, message: error});
				}
			);
	})

	.get('/indicator/:id', function(request, response) {
		if (request.user.type == 'partner')
			return response.status(403).json({error: true, message: "forbidden"});

		var projectsPromise = Project.storageInstance.listByIndicator(request.params.id),
			inputsPromise   = projectsPromise.then(function(projects) {
				return Promise.all(projects.map(p => Input.listByProject(project._id)));
			});

		return Promise.all([projectsPromise, inputsPromise]).then(
			function(queryRes) {
				var projects = queryRes[0], inputsByProject = queryRes[1];

				var result = {};
				for (var i = 0; i < projects.length; ++i) {
					var project = projects[i], inputs = inputsByProject[i];
					result[project._id] = CubeCollection.fromProject(project, inputs).serialize();
				}
				response.json({type: 'cubes', cubes: result});
			},
			function(error) {
				reponse.json({error: true, message: error});
			}
		);
	});

