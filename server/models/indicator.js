"use strict";

var validator = require('is-my-json-valid'),
	Abstract  = require('./abstract'),
	schema    = require('./schemas/indicator'),
	database  = require('../database');

var validate = validator(schema);

module.exports = {
	get: Abstract.get.bind(this, 'indicator'),
	delete: Abstract.delete.bind(this, 'indicator'),
	set: Abstract.set.bind(this),

	list: function(options, callback) {
		var opt;

		if (['tree_level_1', 'tree_level_2', 'tree_level_3'].indexOf(options.mode) !== -1) {
			var standard = options.standard && options.standard !== 'false',
				viewName = standard ? 'indicator_partial_tree' : 'indicator_full_tree';
			
			if (options.mode === 'tree_level_1')
				database.view('shortlists', viewName, {group_level: 1}, function(error, data) {
					callback(null, data.rows.map(function(row) {
						return {themeId: row.key[0], indicators: row.value};
					}));
				});

			else if (options.mode === 'tree_level_2') {
				options.themeId = options.themeId || "";
				opt = {group_level: 2, startkey: [options.themeId], endkey: [options.themeId, {}]};
				database.view('shortlists', viewName, opt, function(error, data) {
					callback(null, data.rows.map(function(row) {
						return {typeId: row.key[1], indicators: row.value};
					}))
				});
			}

			else if (options.mode === 'tree_level_3') {
				// only the indicators used by the project
				options.themeId = options.themeId || "";
				options.typeId  = options.typeId  || "";

				opt = {reduce: false, startkey: [options.themeId, options.typeId], endkey: [options.themeId, options.typeId, {}]};
				database.view('shortlists', viewName, opt, function(error, data) {
					var indicators = [], usageKeys = [];
					data.rows.forEach(function(row) {
						row.value._id = row.id;
						indicators.push(row.value);
						usageKeys.push('input:' + row.id, 'main:' + row.id);
					});

					database.view('shortlists', 'indicator_usage', {keys: usageKeys, group: true}, function(error, data) {
						// FIXME not efficient
						indicators.forEach(function(indicator) {
							indicator.__mainUsage = indicator.__inputUsage = 0;
							data.rows.forEach(function(row) {
								if (row.key === 'main:' + indicator._id)
									indicator.__mainUsage = row.value;
								if (row.key === 'input:' + indicator._id)
									indicator.__inputUsage = row.value;
							})
						});

						callback(null, indicators);
					});
				});
			}
		}

		else if (options.mode === 'project_reporting')
			// the indicators used by the project + all their dependencies (for the used formulas)
			;
		else if (options.mode === 'project_form')
			// the indicators used by the project + all their dependencies (for all formulas)
			;
		else
			return Abstract.list('indicator', options, callback);
	},

	validate: function(item, callback) {
		validate(item);

		var errors = validate.errors || [];
		if (errors.length)
			return callback(errors);

		// FIXME Here we should parse and execute the MathJS formulas to check if they're valid!


		// Check dependencies
		var ids = {type: item.types, theme: item.themes, indicator: []};
		for (var formulaId in item.formulas)
			for (var key in item.formulas[formulaId].parameters)
				if (ids.indicator.indexOf(item.formulas[formulaId].parameters[key]) === -1)
					ids.indicator.push(item.formulas[formulaId].parameters[key]);

		Abstract._checkIds(ids, function(errors) {
			return callback(errors.length ? errors : null)
		});
	}
};
