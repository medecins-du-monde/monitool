"use strict";

angular
	.module('monitool.services.models.user', ['ngResource'])
	.factory('User', function($resource) {
		return $resource('/resources/user/:id', { id: "@_id" }, { save: { method: "PUT" }});
	});
