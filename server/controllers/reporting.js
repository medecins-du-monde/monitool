"use strict";

var express = require('express'),
	Input   = require('../resource/model/input'),
	Project = require('../resource/model/project'),
	CubeCollection = require('../olap/cube-collection');

module.exports = express.Router()

	/**
	 * Generate the cubes for a given project
	 */
	.get('/project/:id', function(request, response) {
		if (request.user.type === 'partner' && request.params.id !== request.user.projectId)
			return response.jsonError(new Error('forbidden'));

		Promise
			.all([
				Project.storeInstance.get(request.params.id),
				Input.storeInstance.listByProject(request.params.id)
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
				response.jsonErrorPB
			);
	})

	/**
	 * Generates the cubes for a given indicator
	 */
	.get('/indicator/:id', function(request, response) {
		if (request.user.type == 'partner')
			return response.jsonError(new Error('forbidden'));

		// Retrieve all stripped down projects that compute this indicator
		// (those contain only the cross-cutting indicator we want, and have all unnecessary
		// forms and variables removed).
		var projectsPromise = Project.storeInstance.listByIndicator(request.params.id, true);

		// Retrieve all inputs from the data sources of the stripped down projects
		// (all inputs that are no use for this particular indicator won't be fetched)
		var inputsPromise = projectsPromise.then(function(projects) {
			// Result of this promise will be an array of array of inputs.
			return Promise.all(
				projects.map(function(project) {
					return Promise.all(
						// Retrieve all inputs for this data source
						project.forms.map(function(form) {
							return Input.storeInstance.listByDataSource(project._id, form.id);
						})
					).then(function(formInputs) {
						// Merge all inputs from different data sources into an array
						// for the whole project.
						return formInputs.reduce(function(memo, arr) { return memo.concat(arr); }, []);
					});
				})
			);
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
			response.jsonErrorPB
		);
	});

