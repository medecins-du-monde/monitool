"use strict";

angular
	.module('monitool.services.fetch', [])
	.service('mtFetch', function($http, $resource, $q, $rootScope) {

		var Project   = $resource('/resources/project/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Indicator = $resource('/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Report    = $resource('/resources/report/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Theme     = $resource('/resources/theme/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Type      = $resource('/resources/type/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			User      = $resource('/resources/user/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Client    = $resource('/resources/client/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			ModelById = { project: Project, indicator: Indicator, report: Report, theme: Theme, type: Type, user: User, client: Client };

		// Add common methods exported by this service (project, projects, projectsById, etc).
		this.project = function(id) {
			if (!id || id === 'new')
				return new Project({
					type: "project",
					name: "",
					begin: new Date(),
					end: new Date(),
					themes: [],
					logicalFrame: {goal: "", indicators: [], purposes: []},
					entities: [],
					groups: [],
					forms: [],
					indicators: {},
					owners: [],
					dataEntryOperators: []
				});
			else
				return Project.get({id: id}).$promise;
		};

		this.indicator = function(id) {
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
					operation: "waiting",
					target: "higher_is_better",
					unit: "%",
					types: [], themes: [], formulas: {}
				});
			else
				return Indicator.get({id: id}).$promise;
		};

		this.report = function(id) {
			return id && id !== 'new' ? Report.get({id: id}).$promise : new Report({
				type: "report",
				name: "",
				date: moment().format('YYYY-MM-DD'),
				elements: []
			});
		};

		this.theme = function(id) {
			if (!id || id === 'new')
				return new Theme({type: 'theme', name: ''});
			else
				return Indicator.get({id: id}).$promise;
		};

		this.type = function(id) {
			if (!id || id === 'new')
				return new Type({type: 'type', name: ''});
			else
				return Indicator.get({id: id}).$promise;
		},

		this.user = function(id) {
			return id && id !== 'new' ? User.get({id: id}).$promise : new User();
		},

		this.client = function(id) {
			if (!id || id === 'new')
				return { name: "", type: "client", secret: "", allowedRedirects: [] };
			else
				return Client.get({id: id}).$promise;
		}

		for (var type in ModelById) {
			// list
			this[type + 's'] = function(type, filters, byId) {
				filters = filters || {};

				var result = filters.ids && filters.ids.length === 0 ? $q.when([]) : ModelById[type].query(filters).$promise;
				if (byId)
					result = result.then(function(models) { var r = {}; models.forEach(function(model) { r[model._id] = model; }); return r; });
				return result;
			}.bind(null, type);;

			// list by id			
			this[type + 'sById'] = function(type, filters) {
				return this[type + 's'](filters, true);
			}.bind(null, type);
		}

		// Add custom this for special needs.
		this.currentUser = this.user.bind(null, 'me');
	});
