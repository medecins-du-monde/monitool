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
		$scope.master = master;
	})
	.catch(function(error) {
		$scope.master = {_id: $routeParams.projectId, type: 'project'};
	})
	.finally(function() {
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

monitoolControllers.controller('InputListController', function($scope, mtDatabase) {

	// Etapes
	//
	// 1. On recupere tous les projets encore en vie.
	//
	// 2. On recupere tous les indicateurs qu'on doit saisir ce mois ci
	//     2.1. On garde les indicateurs sans formule
	//     2.2. On resoud les formules pour obtenir les dependences. 
	//			Si on a des dependences profondes on fait quoi??? (ie, pleins de donnes de base, pas les intermediaires)
	//
	// 3. 

	// var currentMonth = '2014-01';

	// mtDatabase.query('monitool/by_type', {key: 'project', include_docs: true}).then(function(projects) {
	// 	projects = projects.rows.map(function(row) { return row.doc; });

	// 	// Retrieve all indicators that are needed for current month.
	// 	var indicatorsByProjects = {};

	// 	projects.forEach(function(project) {
	// 		var projectIndicators = Object.keys(project.planning).filter(function(indicatorId) {
	// 			var p = project.planning[indicatorId];

	// 			switch (p.periodicity) {
	// 				case 'month': return p.from <= currentMonth && p.to >= currentMonth;
	// 				case 'planned': return false; // @FIXME
	// 				case 'quarter': return false; // @FIXME
	// 				default: throw new Error('Invalid project periodicity.');
	// 			}
	// 		});

	// 		indicatorsByProjects[project._id] = projectIndicators;
	// 		projectIndicators.forEach(function(indicator) {
	// 			indicators[indicator] = true;
	// 		});

	// 	});

	// 	// Resolve dependencies
	// 	mtDatabase.allDocs({keys: Object.keys(indicators), include_docs: true}).then(function(result) {
	// 		// Store all used indicators in the hash
	// 		result.rows.forEach(function(indicator) {
	// 			indicators[indicator.id] = indicator.doc;
	// 		});

	// 		// Add dependencies to all projects.
	// 		for (var projectId in indicatorsByProjects)
	// 			indicatorsByProjects[projectId].requested.forEach(function(indicatorId) {
	// 				var dependencies = indicators[indicatorId];



	// 				// if (indicatorsByProjects[projectId].requested.indexOf(indicatorId))
	// 			});
	// 	});

	// });

});


monitoolControllers.controller('InputEditController', function($q, $scope, $routeParams, mtDatabase) {
	// load project and indicators definition
	mtDatabase.query('project_by_center', {key: $routeParams.centerId, include_docs: true}).then(function(project) {
		return $q.all([
			$q.when(result),
			mtDatabase.allDocs({keys: Object.keys(result[1].planning)})
		]);
	})
	.then(function(result) {
		var project = result[0], indicators = result[1];

		console.log(project, indicators);




	})
	.catch(function(error) {
		console.log(error)
	})
});


///////////////////////////
// Reporting
///////////////////////////

monitoolControllers.controller('ReportingByEntitiesController', function($scope, mtDatabase, mtStatistics) {
	$scope.begin          = '2014-01';
	$scope.end            = '2015-01';
	$scope.types          = ['project', 'center', 'indicator'];
	$scope.selectedType   = 'project';
	$scope.entities       = [];
	$scope.selectedEntity = null;

	$scope.updateList = function() {
		var view = 'monitool/by_type',
			opt  = {include_docs: true, key: $scope.selectedType};

		mtDatabase.query(view, opt).then(function(data) {
			$scope.entities = data.rows.map(function(row) { return row.doc; });
			$scope.selectedEntity = $scope.entities.length ? $scope.entities[0] : null;
			$scope.updateData();
		});
	};

	$scope.updateData = function() {
		var type  = $scope.selectedType,
			id    = $scope.selectedEntity._id,
			begin = $scope.begin,
			end   = $scope.end;

		if ($scope.selectedEntity.type === 'project')
			columns = $scope.selectedEntity.

		mtStatistics.getStatistics(type, id, begin, end).then(function(statistics) {
			$scope.statistics = statistics;

			// type vaut projet, centre ou indicateur.
			// les colonnes sont toujours les mois entre les 2 bornes
			// les lignes sont:
			//		pour projet et centre, les indicateurs disponibles dans le projet.
			//		pour indicateur, les projets qui renseignent cet indicateur.
		});
	};

	$scope.updateList();
});

