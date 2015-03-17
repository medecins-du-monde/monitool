"use strict";

var async     = require('async'),
	validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/indicator'),
	database  = require('../database');

var validate = validator(schema);

var Indicator = module.exports = {
	get: Abstract.get.bind(this, 'indicator'),
	delete: Abstract.delete.bind(this, 'indicator'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		var opt;

		if (options.mode === 'project_logframe') {
			if (!options.projectId)
				return callback('missing_parameter')

			// the indicators used by the project + all their dependencies (for the used formulas)
			database.get(options.projectId, function(error, project) {
				if (error)
					return callback('no_such_project');

				var indicatorIds = Object.keys(project.indicators) || [];
				Indicator._fetchIndicatorsRec(indicatorIds, 1, callback);
			});
		}
		else if (options.mode === 'project_reporting') {
			if (!options.projectId)
				return callback('missing_parameter');
			
			// the indicators used by the project + all their dependencies (for the used formulas)
			database.get(options.projectId, function(error, project) {
				if (error)
					return callback('no_such_project');

				var indicatorIds = Object.keys(project.indicators) || [];
				Indicator._fetchIndicatorsRec(indicatorIds, 10, callback);
			});
		}
		else if (options.mode === 'indicator_edition') {
			if (!options.indicatorId)
				return callback('missing_parameter');
			
			Indicator._fetchIndicatorsRec([options.indicatorId], 2, callback);
		}
		else
			return Abstract.list('indicator', options, callback);
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		return callback(null);

		// Check dependencies
		// var ids = {type: item.types, theme: item.themes, indicator: []};
		// for (var formulaId in item.formulas)
		// 	for (var key in item.formulas[formulaId].parameters)
		// 		if (ids.indicator.indexOf(item.formulas[formulaId].parameters[key]) === -1)
		// 			ids.indicator.push(item.formulas[formulaId].parameters[key]);

		// Abstract._checkIds(ids, function(errors) {
		// 	return callback(errors.length ? errors : null)
		// });
	},

	/**
	 * Fetch id1, id2 and decendents
	 * fetchIndicatorRec([id1, id2], 3, function(error, indicators) { ... })
	 */
	_fetchIndicatorsRec: function(indicatorIds, numIterations, callback, indicators) {
		// Recursion init
		indicators = indicators || [];

		// Recursion termination
		if (indicators.length === indicatorIds.length || numIterations === 0)
			return callback(null, indicators);

		var newIndicatorsIds = indicatorIds.slice(indicators.length);
		database.list({keys: newIndicatorsIds, include_docs: true}, function(error, result) {

			newIndicatorsIds.forEach(function(indicatorId) {
				// we search in the result rows instead of just iterating them to retrieve
				// the indicators in a predicable order.
				var candidates = result.rows.filter(function(row) { return row.id === indicatorId; }),
					indicator  = candidates.length ? candidates[0].doc : null;

				if (indicator) {
					// add indicator to the list.
					indicators.push(indicator);

					// add its dependencies to the id list so that we can fetch them
					for (var formulaId in indicator.formulas)
						for (var key in indicator.formulas[formulaId].parameters)
							if (indicatorIds.indexOf(indicator.formulas[formulaId].parameters[key]) === -1)
								indicatorIds.push(indicator.formulas[formulaId].parameters[key]);
				}
			});

			// recurse to fetch
			return Indicator._fetchIndicatorsRec(indicatorIds, --numIterations, callback, indicators);
		});
	}
};
