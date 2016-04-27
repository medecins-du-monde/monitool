"use strict";

angular
	.module('monitool.services.models.user', ['ngResource'])
	.factory('User', function($resource, $q, $rootScope) {
		return $resource('/resources/user/:id', { id: "@_id" }, { save: { method: "PUT" }});
	});
