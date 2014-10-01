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

monitoolControllers.controller('ProjectListController', function($scope, $location, mtDatabase) {
	mtDatabase.query('monitool/by_type', {include_docs: true, key: 'project'}).then(function(projects) {
		$scope.projects = projects.rows.map(function(row) { return row.doc; });
	});

	$scope.create = function() {
		$location.url('/projects/' + PouchDB.utils.uuid().toLowerCase());
	};
});

monitoolControllers.controller('ProjectDescriptionController', function($scope, $routeParams, $q, mtDatabase) {
	mtDatabase.get($routeParams.projectId).then(function(master) {
		$scope.master = master; // Edit

	}).catch(function(error) {
		$scope.master = {_id: $routeParams.projectId, type: 'project'}; // Create

	}).finally(function() {
		$scope.update = function(project) {
			$scope.master = angular.copy(project);
			mtDatabase.put($scope.master).then(function(project) {
				$scope.master._rev = $scope.project._rev = project.rev;
			});
		};

		$scope.reset = function() {
			$scope.project = angular.copy($scope.master);
		};

		$scope.reset();
	});
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

monitoolControllers.controller('InputListController', function($scope) {

});

monitoolControllers.controller('InputEditController', function($scope) {

});


///////////////////////////
// Reporting
///////////////////////////

monitoolControllers.controller('ReportingByEntitiesController', function($scope, mtDatabase) {
	$scope.months = ['2013/01', '2013/02', '2013/03', '2013/04', '2013/05', '2013/06'];

	mtDatabase.query('monitool/by_type', {include_docs: true, key: 'project'}).then(function(data) {
		$scope.projects = data.rows.map(function(row) { return row.doc; });
		$scope.selectedProject = $scope.projects.length ? $scope.projects[0] : null;
		$scope.update();
	});

	$scope.update = function() {
		var project  = $scope.selectedProject,
			stats    = {};

		mtDatabase.query('monitool/input_by_project', {include_docs: true, key: project._id}).then(function(inputs) {
			inputs = inputs.rows.map(function(row) { return row.doc; });
			// inputs.sort(function(input1, input2) { return input1.begin > input2.begin ? 1 : -1 });

			console.log(inputs);
		});
	};
});

monitoolControllers.controller('ReportingByIndicatorsController', function($scope) {


});
