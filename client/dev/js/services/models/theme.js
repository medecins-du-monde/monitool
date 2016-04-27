"use strict";

angular
	.module('monitool.services.models.theme', ['ngResource'])
	.factory('Theme', function($resource, $q, $rootScope) {
		return $resource('/resources/theme/:id', { id: "@_id" }, { save: { method: "PUT" }});
	});
