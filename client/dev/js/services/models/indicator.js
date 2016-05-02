"use strict";

angular
	.module('monitool.services.models.indicator', ['ngResource'])
	.factory('Indicator', function($resource) {

		var Indicator = $resource('/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Indicator.prototype.reset = function() {
			this.type = "indicator";
			this.name = {en: '', fr: '', es: ''};
			this.standard = {en: '', fr: '', es: ''};
			this.sources = {en: '', fr: '', es: ''};
			this.comments = {en: '', fr: '', es: ''};
			this.operation = 'waiting';
			this.types = [];
			this.themes = [];
		};

		return Indicator;
	});
