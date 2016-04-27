"use strict";

angular
	.module('monitool.services.models.indicator', ['ngResource'])
	.factory('Indicator', function($resource, $q, $rootScope) {
		return $resource('/resources/indicator/:id', { id: "@_id" }, { save: { method: "PUT" }});
	});
