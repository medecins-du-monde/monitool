"use strict";

var app = angular.module('MonitoolApp', [
	'ngRoute',
	'MonitoolControllers',
	'MonitoolDirectives',
	'MonitoolServices'
]);

app.config(function($routeProvider) {

	$routeProvider.when('/help', {
		redirectTo: '/help/monitoring'
	});

	$routeProvider.when('/help/monitoring', {
		templateUrl: 'partials/help/monitoring.html'
	});

	$routeProvider.when('/help/documentation', {
		templateUrl: 'partials/help/documentation.html'
	});


	$routeProvider.when('/sync', {
		templateUrl: 'partials/sync.html'
	});

	///////////////////////////
	// Project
	///////////////////////////

	$routeProvider.when('/projects', {
		templateUrl: 'partials/projects/list.html',
		controller: 'ProjectListController',
		resolve: {
			projects: function(mtFetch) { return mtFetch.projects(); }
		}
	});

	$routeProvider.when('/projects/:projectId/logical-frame', {
		templateUrl: 'partials/projects/logical-frame.html',
		controller: 'ProjectLogicalFrameController',
		resolve: {
			project: function($route, $q, mtDatabase) {
				if ($route.current.params.projectId === 'new') {
					return $q.when({
						type: "project",
						name: "",
						begin: "",
						end: "",
						logicalFrame: {goal: "", indicators: [], purposes: []},
						inputEntities: [],
						inputGroups: [],
						dataCollection: [],
						indicators: {}
					});
				}
				else
					return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/input-entities', {
		templateUrl: 'partials/projects/input-entities.html',
		controller: 'ProjectInputEntitiesController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/input-entities/:entityId', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'entity'; },
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/input-groups', {
		templateUrl: 'partials/projects/input-groups.html',
		controller: 'ProjectInputGroupsController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/input-groups/:groupId', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'group'; },
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/forms', {
		templateUrl: 'partials/projects/form-list.html',
		controller: 'ProjectFormsController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/forms/:formId', {
		templateUrl: 'partials/projects/form-edit.html',
		controller: 'ProjectFormEditionController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/users', {
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/inputs', {
		templateUrl: 'partials/projects/input-list.html',
		controller: 'ProjectInputListController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			},
			inputs: function($route, mtDatabase) {
				return mtDatabase.allDocs({
					startkey: $route.current.params.projectId + ':',
					endkey: $route.current.params.projectId + ':~'
				}).then(function(result) {
					var i = {};
					result.rows.forEach(function(row) { i[row.id] = true; });
					return i;
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId/input/:period/:formId/:entityId', {
		templateUrl: 'partials/projects/input.html',
		controller: 'ProjectInputController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			},
			input: function($route, mtDatabase) {
				var p  = $route.current.params,
					id = [p.projectId, p.entityId, p.period, p.formId].join(':');

				return mtDatabase.get(id).catch(function(error) {
					return {
						_id: id, type: 'input',
						project: p.projectId, entity: p.entityId, form: p.formId, period: p.period,
						indicators: { }
					};
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId/reporting', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'project'; },
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/users', {
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId', {
		redirectTo: '/projects/:projectId/logical-frame'
	});

	///////////////////////////
	// Indicators
	///////////////////////////

	$routeProvider.when('/indicators', {
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController',
		resolve: {
			indicatorHierarchy: function(mtFetch) { return mtFetch.indicatorHierarchy(); },
			typesById: function(mtFetch) { return mtFetch.typesById(); },
			themesById: function(mtFetch) { return mtFetch.themesById(); }
		}
	});

	$routeProvider.when('/indicators/:indicatorId', {
		templateUrl: 'partials/indicators/edit.html',
		controller: 'IndicatorEditController',
		resolve: {
			indicator: function($route, $q, mtDatabase) {
				if ($route.current.params.indicatorId === 'new')
					return $q.when({
						type: 'indicator',
						name: '',
						description: '',
						history: '',
						standard: false,
						sumAllowed: false,
						types: [],
						themes: [],
						formulas: {}
					});
				else
					return mtDatabase.get($route.current.params.indicatorId);
			},
			indicators: function(mtFetch) { return mtFetch.indicators(); },
			types: function(mtFetch) { return mtFetch.types(); },
			themes: function(mtFetch) { return mtFetch.themes(); }
		}
	});

	$routeProvider.when('/themes', {
		templateUrl: 'partials/indicators/theme-list.html',
		controller: 'ThemeListController',
		resolve: {themes: function(mtFetch) { return mtFetch.themes(); }}
	});

	$routeProvider.when('/types', {
		templateUrl: 'partials/indicators/type-list.html',
		controller: 'TypeListController',
		resolve: {types: function(mtFetch) { return mtFetch.types(); }}
	});

	// $routeProvider.otherwise({
	// 	redirectTo: '/projects'
	// });
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['MonitoolApp']);
});

