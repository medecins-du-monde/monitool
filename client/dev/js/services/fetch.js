"use strict";

angular.module('monitool.services.fetch', [])
	.factory('mtFetch', function($http, $resource) {
		$http.defaults.headers.common.Authorization = 'Basic ' + btoa('');

		$http.defaults.transformRequest.unshift(function(data) {
			if (!data)
				return data;

			// FIXME this method is misnamed (it also remove virtual properties)
			var stringifyDates = function(model) {
				// transform dates
				if (Object.prototype.toString.call(model) === '[object Date]')
					return moment(model).format('YYYY-MM-DD');

				// recurse
				if (Array.isArray(model)) {
					var numChildren = model.length;
					for (var i = 0; i < numChildren; ++i)
						model[i] = stringifyDates(model[i]);
				}
				else if (typeof model === 'object' && model !== null) {
					for (var key in model)
						// remove virtual properties
						if (key.substring(0, 2) === '__')
							delete model[key];
						else
							model[key] = stringifyDates(model[key]);
				}

				return model;
			};

			data = angular.copy(data); // we don't want to change the original one do avoid breaking the display.
			data = stringifyDates(data); // stringify all dates
			data = JSON.parse(angular.toJson(data)); // remove angular $$hashKeys
			return data;
		});

		$http.defaults.transformResponse.push(function(data) {
			var parseDatesRec = function(model) {
				if (typeof model === 'string' && model.match(/^\d\d\d\d\-\d\d\-\d\d$/))
					return new Date(model);

				if (Array.isArray(model)) {
					var numChildren = model.length;
					for (var i = 0; i < numChildren; ++i)
						model[i] = parseDatesRec(model[i]);
				}
				else if (typeof model === 'object' && model !== null) {
					for (var key in model)
						model[key] = parseDatesRec(model[key]);
				}

				return model;
			};

			return parseDatesRec(data);
		});

		var Project   = $resource('http://localhost:8000/project/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Indicator = $resource('http://localhost:8000/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Input     = $resource('http://localhost:8000/input/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Theme     = $resource('http://localhost:8000/theme/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			Type      = $resource('http://localhost:8000/type/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			User      = $resource('http://localhost:8000/user/:id', { id: "@_id" }, { save: { method: "PUT" }}),
			ModelById = { project: Project, indicator: Indicator, input: Input, theme: Theme, type: Type, user: User };

		// Add common methods exported by this service (project, projects, projectsById, etc).
		var methods = {}
		for (var type in ModelById) {
			// fetch
			methods[type] = function(type, id) {
				return id ? ModelById[type].get({id: id}).$promise : new ModelById[type]();
			}.bind(null, type);

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

		methods.currentPreviousInput = function(p) {
		};

		return methods;
	});
