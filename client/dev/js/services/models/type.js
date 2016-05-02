"use strict";

angular
	.module('monitool.services.models.type', ['ngResource'])
	.factory('Type', function($resource) {
		var Type = $resource('/resources/type/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Type.prototype.reset = function() {
			this.name = {fr: '', en: '', es: ''};
			this.type = 'type';
		}

		return Type;
	});
