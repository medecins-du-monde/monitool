"use strict";

angular
	.module('monitool.services.models.theme', ['ngResource'])
	.factory('Theme', function($resource) {
		var Theme = $resource('/resources/theme/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Theme.prototype.reset = function() {
			this.name = {fr: '', en: '', es: ''};
			this.type = 'theme';
		}

		return Theme;
	});
