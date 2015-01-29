"use strict";

var express   = require('express'),
	Indicator = require('../models/indicator'),
	Input     = require('../models/input'),
	Project   = require('../models/project'),
	Theme     = require('../models/theme'),
	Type      = require('../models/type'),
	User      = require('../models/user');

var ModelsByName = {indicator: Indicator, input: Input, project: Project, theme: Theme, type: Type, user: User},
	router       = express.Router();


router.get('/user/me', function(request, response) {
	response.json(request.user || null);
});

router.get('/:modelName(project|indicator|input|theme|type|user)', function(request, response) {
	var Model = ModelsByName[request.params.modelName];

	Model.list(request.query, function(error, data) {
		response.json(data);
	});
});

router.get('/:modelName(project|indicator|input|theme|type|user)/:id', function(request, response) {
	var Model = ModelsByName[request.params.modelName];

	Model.get(request.params.id, function(error, data) {
		if (error) {
			if (error.error === 'not_found')
				return response.status(404).json({error: true, message: "Not Found"});
			else
				return response.status(500).json({error: true, message: "Server"});
		}

		response.json(data);
	});
});

router.get('/project/:projectId/input', function(request, response) {
	var options   = { begin: request.query.begin, end: request.query.end },
		projectId = request.params.projectId;

	Input.listByProject(projectId, options, function(error, inputs) {
		response.json(inputs);
	});
});

router.get('/project/:projectId/:subType(entity|group|form)/:subTypeId/input', function(request, response) {
	var options   = { begin: request.query.begin, end: request.query.end },
		projectId = request.params.projectId,
		subType   = request.params.subType,
		subTypeId = request.params.subTypeId;

	Input.listByProjectSubType(projectId, subType, subTypeId, options, function(error, inputs) {
		response.json(inputs);
	});
});




module.exports = router;
