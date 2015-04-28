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

	list: function(options, callback) {
		var opt;

		if (options.mode === 'project') {
			if (!options.projectId)
				return callback('missing_parameter')

			// the indicators used by the project + all their dependencies (for the used formulas)
			database.get(options.projectId, function(error, project) {
				if (error)
					return callback('no_such_project');

				var indicatorIds = Object.keys(project.indicators) || [];
				return Abstract.list('indicator', {ids: indicatorIds}, callback);
			});
		}
		else
			return Abstract.list('indicator', options, callback);
	},

	set: function(newIndicator, callback) {
		database.get(newIndicator._id, function(error, oldIndicator) {
			if (oldIndicator) {
				// Retrieve all changed formula ids.
				var changedFormulasIds = Object.keys(oldIndicator.formulas).filter(function(formulaId) {
					if (!newIndicator.formulas[formulaId])
						return true;
					
					var oldParameters = Object.keys(oldIndicator.formulas[formulaId].parameters).sort(),
						newParameters = Object.keys(newIndicator.formulas[formulaId].parameters).sort();

					return JSON.stringify(oldParameters) !== JSON.stringify(newParameters);
				});

				// Fetch all projectIds that use this formula in a datacollection
				database.view('server', 'reverse_dependencies', {keys: changedFormulasIds, reduce: false, offset: 0}, function(error, data) {
					// Fetch all projects.
					database.fetch({keys: data.rows.map(function(row) { return row.id; })}, function(error, result) {
						
						var projects = result.rows.map(function(row) { return row.doc; });

						// Remove the field from the concerned datacollections
						projects.forEach(function(project) {
							project.dataCollection.forEach(function(form) {
								form.fields = form.fields.filter(function(field) {
									return field.type !== 'formula' || changedFormulasIds.indexOf(field.formulaId) === -1;
								});
							});
						});

						// save them all
						database.bulk({docs: projects}, function() {
							Abstract.set(newIndicator, callback);
						});
					});
				});
			}
			else
				Abstract.set(newIndicator, callback);
		});
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		return callback(null);
	}
	
};
