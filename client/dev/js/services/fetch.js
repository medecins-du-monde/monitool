"use strict";

angular.module('monitool.services.fetch', [])
	.factory('mtFetch', function($http, $resource, $q, $rootScope) {
		var Project   = $resource('/resources/project/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Indicator = $resource('/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Report    = $resource('/resources/report/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Theme     = $resource('/resources/theme/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Type      = $resource('/resources/type/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			User      = $resource('/resources/user/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			ModelById = { project: Project, indicator: Indicator, report: Report, theme: Theme, type: Type, user: User };

		// Add common methods exported by this service (project, projects, projectsById, etc).
		var methods = {
			project: function(id) {
				if (!id || id === 'new')
					return new Project({
						type: "project",
						name: "",
						begin: new Date(),
						end: new Date(),
						themes: [],
						logicalFrame: {goal: "", indicators: [], purposes: []},
						inputEntities: [],
						inputGroups: [],
						dataCollection: [],
						indicators: {},
						owners: [],
						dataEntryOperators: []
					});
				else
					return Project.get({id: id}).$promise;
			},

			indicator: function(id) {
				var tran = {};
				for (var key in $rootScope.languages)
					tran[key] = "";

				if (!id || id === 'new')
					return new Indicator({
						type: 'indicator',
						name: angular.copy(tran),
						standard: angular.copy(tran),
						sources: angular.copy(tran),
						comments: angular.copy(tran),

						operation: "common", target: "higher_is_better",
						unit: "%",
						types: [], themes: [], formulas: {}
					});
				else
					return Indicator.get({id: id}).$promise;
			},

			report: function(id) {
				return id && id !== 'new' ? Report.get({id: id}).$promise : new Report({
					type: "report",
					name: "",
					date: moment().format('YYYY-MM-DD'),
					elements: []
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
