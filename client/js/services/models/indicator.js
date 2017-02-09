"use strict";

angular
	.module('monitool.services.models.indicator', ['ngResource'])
	.factory('Indicator', function($resource) {

		var Indicator = $resource('/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Indicator.fetchForProject = function(project) {
			return Indicator.query({mode: "project_indicators", projectId: project._id}).$promise;
		};

		Indicator.prototype.reset = function() {
			this.type = "indicator";
			this.name = {en: '', fr: '', es: ''};
			this.description = {en: '', fr: '', es: ''};
			this.themes = [];
		};

		return Indicator;
	});
