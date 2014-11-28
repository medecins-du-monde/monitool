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
	}

	return {
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
					type: 'indicator',
					name: '',
					description: '',
					history: '',
					standard: false,
					sumAllowed: false,
					types: [],
					themes: [],
					formulas: {}
				});
			else
				return mtDatabase.current.get(indicatorId);
		},
		indicators: function() {
			return mtDatabase.current.query('shortlists/indicators_short', {group: true}).then(reformatArray);
		},		
		indicatorHierarchy: function(forbiddenIds) {
			return mtDatabase.current.query('shortlists/indicators_short', {group: true}).then(function(result) {
				var hierarchy = {};

				result.rows.forEach(function(row) {
					// skip forbidden indicators if parameter was provided (for logical frame edition, and avoiding double indicators)
					if (forbiddenIds && forbiddenIds.indexOf(row.key) !== -1)
						return;

					// add dummy types and themes
					!row.value.themes.length && row.value.themes.push('');
					!row.value.types.length  && row.value.types.push('');

					row.value.themes.forEach(function(theme) {
						row.value.types.forEach(function(type) {
							// add empty tree branches if those are undefined
							!hierarchy[theme] && (hierarchy[theme] = {});
							!hierarchy[theme][type] && (hierarchy[theme][type] = []);

							row.value._id = row.key;
							hierarchy[theme][type].push(row.value);
						});
					});
				});

				return hierarchy;
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
				var current, previous;

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

				if (!current)
					current = {
						_id: id, type: 'input',
						project: p.projectId, entity: p.entityId, form: p.formId, period: p.period,
						indicators: { }
					};

				return {current: current, previous: previous};
			});
		}
	};
});
