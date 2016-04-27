"use strict";

angular
	.module('monitool.services.models.type', ['ngResource'])
	.factory('Type', function($resource, $q, $rootScope) {
		return $resource('/resources/type/:id', { id: "@_id" }, { save: { method: "PUT" }});
	});
