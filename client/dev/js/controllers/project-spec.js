"use strict";

angular.module('monitool.controllers.project.spec', [])

	.controller('ProjectBasicsController', function($scope, themes) {
		$scope.themes = themes;
	})

	.controller('ProjectUserListController', function($scope, users) {
		$scope.users = users;
	});

