"use strict";

var fetchServices = angular.module('monitool.services.fetch', ['monitool.services.database']);

fetchServices.factory('mtFetch', function($q, mtDatabase) {
	var reformatArray = function(result) {
		return result.rows.map(function(row) {
			row.value._id = row.key;
			return row.value;
		});
	};

	var reformatHashById = function(result) {
		var types = {};
		result.rows.forEach(function(row) { return types[row.key] = row.value; });
		return types;
	};

	var handleError = function(error) {
		console.log(error)
	};

	var afterLoad = function(model) {
		if (typeof model === 'string' && model.match(/\d\d\d\d\-\d\d\-\d\d/))
			return new Date(model);

		if (Array.isArray(model)) {
			var numChildren = model.length;
			for (var i = 0; i < numChildren; ++i)
				model[i] = afterLoad(model[i]);
		}
		else if (typeof model === 'object' && model !== null) {
			for (var key in model)
				model[key] = afterLoad(model[key]);
		}

		return model;
	};

	var beforeSave = function(model) {
		var beforeSaveRec = function(model) {

			console.log(Object.prototype.toString.call(model));
			if (Object.prototype.toString.call(model) === '[object Date]')
				return moment(model).format('YYYY-MM-DD');

			if (Array.isArray(model)) {
				var numChildren = model.length;
				for (var i = 0; i < numChildren; ++i)
					model[i] = beforeSaveRec(model[i]);
			}
			else if (typeof model === 'object' && model !== null) {
				for (var key in model)
					model[key] = beforeSaveRec(model[key]);
			}

			return model;
		};

		model = beforeSaveRec(angular.copy(model));
		return JSON.parse(angular.toJson(model));
	};

	return {

		afterLoad: afterLoad,
		beforeSave: beforeSave,

		project: function(projectId) {
			if (projectId === 'new') {
				return $q.when({
					type: "project",
					name: "",
					begin: "",
					end: "",
					logicalFrame: {goal: "", indicators: [], purposes: []},
					inputEntities: [],
					inputGroups: [],
					dataCollection: [],
					indicators: {},
					owners: [],
					dataEntryOperators: []
				});
			}
			else
				return mtDatabase.current.get(projectId);
		},
		projects: function() {
			return mtDatabase.current.query('shortlists/projects_short').then(reformatArray).catch(handleError);
		},
		projectsByIndicator: function(indicatorId) {
			return mtDatabase.current.query('shortlists/projects_by_indicator', {key: indicatorId, include_docs: true}).then(function(result) {
				return result.rows.map(function(row) { return row.doc; });
			});
		},

		indicator: function(indicatorId) {
			if (indicatorId === 'new')
				return $q.when({
					type: 'indicator', name: '', description: '', history: '',
					standard: false, geoAggregation: 'none', timeAggregation: 'none',
					types: [], themes: [], formulas: {}
				});
			else
				return mtDatabase.current.get(indicatorId);
		},
		
		indicatorsByProject: function(project) {
			var indicatorsById = {};

			// FIXME for now let's say that loading 2 levels is enought for all cases.
			return mtDatabase.current.allDocs({include_docs: true, keys: Object.keys(project.indicators)}).then(function(result) {
				result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });

				var newIndicatorsIds = {};
				result.rows.forEach(function(row) {
					for (var formulaId in row.doc.formulas)
						for (var key in row.doc.formulas[formulaId].parameters)
							if (!indicatorsById[row.doc.formulas[formulaId].parameters[key]]) // avoid double retrieve
								newIndicatorsIds[row.doc.formulas[formulaId].parameters[key]] = true;
				});

				if (!Object.keys(newIndicatorsIds).length)
					return indicatorsById;
				else
					return mtDatabase.current.allDocs({include_docs: true, keys: Object.keys(newIndicatorsIds)}).then(function(result) {
						result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });
						return indicatorsById;
					});
			});
		},

		themes: function() {
			return mtDatabase.current.query('shortlists/themes_short', {group: true}).then(reformatArray);
		},
		themesById: function() {
			return mtDatabase.current.query('shortlists/themes_short', {group: true}).then(reformatHashById);
		},
		types: function() {
			return mtDatabase.current.query('shortlists/types_short', {group: true}).then(reformatArray);
		},
		typesById: function() {
			return mtDatabase.current.query('shortlists/types_short', {group: true}).then(reformatHashById);
		},

		currentPreviousInput: function(p) {
			var id       = [p.projectId, p.entityId, p.formId, p.period].join(':'),
				startKey = id,
				endKey   = [p.projectId, p.entityId, p.formId].join(':'),
				options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true};

			return mtDatabase.current.allDocs(options).then(function(result) {
				// retrieve current and previous from view result.
				var current, previous, isNew;

				if (result.rows.length == 0) // we got no result at all.
					current = previous = null;
				else if (result.rows.length === 1) {
					if (result.rows[0].id !== id) { // we only got an old input
						current = null;
						previous = result.rows[0].doc;
					}
					else { // we only got the current input
						current = result.rows[0].doc;
						previous = null;
					}
				}
				else if (result.rows.length === 2) {
					if (result.rows[0].id !== id) { // we got two old inputs
						current = null;
						previous = result.rows[0].doc;
					}
					else { // we got the current and previous inputs
						current = result.rows[0].doc;
						previous = result.rows[1].doc;
					}
				}

				if (!current) {
					isNew = true
					current = {
						_id: id, type: 'input',
						project: p.projectId, entity: p.entityId, form: p.formId, period: p.period,
						values: { count: 1 }
					};
				}
				else
					isNew = false;

				return {current: current, previous: previous, isNew: isNew};
			});
		}
	};
});
