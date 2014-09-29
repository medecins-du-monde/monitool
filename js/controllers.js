"use strict";

var monitoolControllers = angular.module('MonitoolControllers', ['MonitoolServices']);

monitoolControllers.controller('MenuController', function($scope, $location) {

	$scope.routes = [
		{path: '#projects', name: "Projects"},
		{path: '#indicators', name: "Catalogue Indicateurs"},
		{path: '#inputs', name: "Saisies en attente"},
		{path: '#reporting', name: "Consultation"},
	];

	$scope.isSelected = function(route) {
		return route.path.substring(1) !== $location.path().substring(1);
	};

	$scope.isVisible = function(route) {
		return true;
	};
});



///////////////////////////
// Project
///////////////////////////

monitoolControllers.controller('ProjectListController', function($scope, mtDatabase) {
	mtDatabase.getProjects().then(function(projects) {
		$scope.projects = projects;
	});
});

monitoolControllers.controller('ProjectDescriptionController', function($scope) {

});

monitoolControllers.controller('ProjectCenterListController', function($scope) {

});

monitoolControllers.controller('ProjectCenterEditController', function($scope) {

});

monitoolControllers.controller('ProjectUserListController', function($scope) {

});

monitoolControllers.controller('ProjectUserEditController', function($scope) {

});

monitoolControllers.controller('ProjectIndicatorListController', function($scope) {

});

monitoolControllers.controller('ProjectIndicatorEditController', function($scope) {

});


///////////////////////////
// Indicators
///////////////////////////

monitoolControllers.controller('IndicatorListController', function($scope) {

});

monitoolControllers.controller('IndicatorEditController', function($scope) {

});

monitoolControllers.controller('TypeEditController', function($scope) {

});

monitoolControllers.controller('ThemeEditController', function($scope) {

});

///////////////////////////
// Input
///////////////////////////

monitoolControllers.controller('InputEditController', function($scope) {

});

monitoolControllers.controller('InputListController', function($scope) {

});

///////////////////////////
// Reporting
///////////////////////////

monitoolControllers.controller('ReportingByEntitiesController', function($scope) {

});

monitoolControllers.controller('ReportingByIndicatorsController', function($scope) {

});
