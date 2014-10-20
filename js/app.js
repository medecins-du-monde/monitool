"use strict";

var app = angular.module('MonitoolApp', ['ngRoute', 'MonitoolControllers', 'MonitoolDirectives']);

app.config(function($routeProvider) {

	///////////////////////////
	// Project
	///////////////////////////

	$routeProvider.when('/projects', {
		templateUrl: 'partials/projects/list.html',
		controller: 'ProjectListController'
	});

	$routeProvider.when('/projects/:projectId/description', {
		templateUrl: 'partials/projects/description.html',
		controller: 'ProjectDescriptionController'
	});

	$routeProvider.when('/projects/:projectId/centers', {
		templateUrl: 'partials/projects/center-list.html',
		controller: 'ProjectCenterListController'
	});

	$routeProvider.when('/projects/:projectId/centers/:centerId', {
		templateUrl: 'partials/projects/center-edit.html',
		controller: 'ProjectCenterEditController'
	});

	$routeProvider.when('/projects/:projectId/users', {
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController'
	});

	$routeProvider.when('/projects/:projectId/users/:userId', {
		templateUrl: 'partials/projects/user-edit.html',
		controller: 'ProjectUserEditController'
	});

	$routeProvider.when('/projects/:projectId/plannings', {
		templateUrl: 'partials/projects/planning-list.html',
		controller: 'ProjectPlanningListController'
	});

	$routeProvider.when('/projects/:projectId/plannings/:indicatorId', {
		templateUrl: 'partials/projects/planning-edit.html',
		controller: 'ProjectPlanningEditController'
	});

	$routeProvider.when('/projects/:projectId', {
		redirectTo: '/projects/:projectId/description'
	});

	///////////////////////////
	// Indicators
	///////////////////////////

	$routeProvider.when('/indicators', {
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController'
	});

	$routeProvider.when('/indicators/:indicatorId', {
		templateUrl: 'partials/indicators/edit.html',
		controller: 'IndicatorEditController'
	});

	$routeProvider.when('/themes', {
		templateUrl: 'partials/indicators/theme-list.html',
		controller: 'ThemeListController'
	});

	$routeProvider.when('/types', {
		templateUrl: 'partials/indicators/type-list.html',
		controller: 'TypeListController'
	});


	///////////////////////////
	// Input
	///////////////////////////


	$routeProvider.when('/inputs', {
		templateUrl: 'partials/input/list.html',
		controller: 'InputListController'
	});

	$routeProvider.when('/inputs/:month/:centerId', {
		templateUrl: 'partials/input/edit.html',
		controller: 'InputEditController'
	});

	///////////////////////////
	// Reporting
	///////////////////////////

	$routeProvider.when('/reporting', {
		templateUrl: 'partials/reporting/by-entities.html',
		controller: 'ReportingByEntitiesController'
	});

	$routeProvider.otherwise({
		redirectTo: '/projects'
	});
});
