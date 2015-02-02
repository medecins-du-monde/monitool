"use strict";

angular.module('monitool.services.fetch', [])
	.factory('mtFetch', function($http, $resource, $q) {
		$http.defaults.headers.common.Authorization = 'Basic ' + btoa('');

		var Project   = $resource('/project/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Indicator = $resource('/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Input     = $resource('/input/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Theme     = $resource('/theme/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Type      = $resource('/type/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			User      = $resource('/user/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			ModelById = { project: Project, indicator: Indicator, input: Input, theme: Theme, type: Type, user: User };

		// Add common methods exported by this service (project, projects, projectsById, etc).
		var methods = {
			project: function(id) {
				if (!id || id === 'new')
					return new Project({
						type: "project",
						name: "",
						begin: new Date(),
						end: new Date(),
						logicalFrame: {goal: "", indicators: [], purposes: []},
						inputEntities: [],
						inputGroups: [],
						dataCollection: [],
						indicators: {},
						owners: [],
						dataEntryOperators: []
					});
				else
					return Project.get({id: id}).$promise
			},

			indicator: function(id) {
				if (!id || id === 'new')
					return new Indicator({
						type: 'indicator', name: '', description: '', history: '',
						standard: false, unit: "", geoAggregation: 'none', timeAggregation: 'none',
						types: [], themes: [], formulas: {}
					});
				else
					return Indicator.get({id: id}).$promise;
			},

			input: function(id) {
				return id && id !== 'new' ? Input.get({id: id}).$promise : new Input({
					type: "input",
					values: {count: 1}
				});
			},

			theme: function(id) {
				if (!id || id === 'new')
					return new Theme({type: 'theme', name: ''});
				else
					return Indicator.get({id: id}).$promise;
			},

			type: function(id) {
				if (!id || id === 'new')
					return new Type({type: 'type', name: ''});
				else
					return Indicator.get({id: id}).$promise;
			},

			user: function(id) {
				return id && id !== 'new' ? User.get({id: id}).$promise : new User();
			}
		};

		for (var type in ModelById) {
			// list
			methods[type + 's'] = function(type, filters, byId) {
				filters = filters || {};

				var result = filters.ids && filters.ids.length === 0 ? $q.when([]) : ModelById[type].query(filters).$promise;
				if (byId)
					result = result.then(function(models) { var r = {}; models.forEach(function(model) { r[model._id] = model; }); return r; });
				return result;
			}.bind(null, type);;

			// list by id			
			methods[type + 'sById'] = function(type, filters) {
				return methods[type + 's'](filters, true);
			}.bind(null, type);
		}

		// Add custom methods for special needs.
		methods.currentUser = methods.user.bind(null, 'me');

		return methods;
	});
