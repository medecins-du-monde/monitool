"use strict";

var app = angular.module('MonitoolApp', [
	'ngRoute',
	'MonitoolControllers',
	'MonitoolDirectives',
	'MonitoolServices'
]);

app.config(function($routeProvider) {

	$routeProvider.when('/offline-fail', {
		templateUrl: 'partials/workflow/offline-fail.html'
	});

	$routeProvider.when('/login', {
		controller: 'LoginController',
		templateUrl: 'partials/workflow/login.html'
	});

	$routeProvider.when('/help', {
		redirectTo: '/help/monitoring'
	});

	$routeProvider.when('/help/monitoring', {
		templateUrl: 'partials/help/monitoring.html'
	});

	$routeProvider.when('/help/documentation', {
		templateUrl: 'partials/help/documentation.html'
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
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/input-entities', {
		templateUrl: 'partials/projects/input-entities.html',
		controller: 'ProjectInputEntitiesController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/input-entities/:entityId', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'entity'; },
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/input-groups', {
		templateUrl: 'partials/projects/input-groups.html',
		controller: 'ProjectInputGroupsController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/input-groups/:groupId', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'group'; },
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/forms', {
		templateUrl: 'partials/projects/form-list.html',
		controller: 'ProjectFormsController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/forms/:formId', {
		templateUrl: 'partials/projects/form-edit.html',
		controller: 'ProjectFormEditionController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/users', {
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/inputs', {
		templateUrl: 'partials/projects/input-list.html',
		controller: 'ProjectInputListController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); },
			inputs: function($route, mtDatabase) {
				return mtDatabase.current.allDocs({
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
			project: function(mtFetch) {
				return mtFetch.currentProject();
			},
			inputs: function($route, mtDatabase) {
				var p        = $route.current.params,
					id       = [p.projectId, p.entityId, p.formId, p.period].join(':'),
					startKey = id,
					endKey   = [p.projectId, p.entityId, p.formId].join(':'),
					options  = {startkey: startKey, endkey: endKey, descending: true, limit: 2, include_docs: true};

				return mtDatabase.current.allDocs(options).then(function(result) {
					// retrieve current and previous from view result.
					var current, previous;

					if (result.rows.length == 0) // we got no result at all.
						current = previous = null;
					else if (result.rows.length === 1) {
						if (result.rows[0].id !== id) { // we only got an old input
							current = null;
							previous = result.rows[0].doc;
						}
						else { // we only got the current input
							current = result.rows[0].doc;
							previous = null;
						}
					}
					else if (result.rows.length === 2) {
						if (result.rows[0].id !== id) { // we got two old inputs
							current = null;
							previous = result.rows[0].doc;
						}
						else { // we got the current and previous inputs
							current = result.rows[0].doc;
							previous = result.rows[1].doc;
						}
					}

					if (!current)
						current = {
							_id: id, type: 'input',
							project: p.projectId, entity: p.entityId, form: p.formId, period: p.period,
							indicators: { }
						};

					return {current: current, previous: previous};
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId/reporting', {
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'project'; },
			project: function(mtFetch) { return mtFetch.currentProject(); }
		}
	});

	$routeProvider.when('/projects/:projectId/users', {
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			project: function(mtFetch) { return mtFetch.currentProject(); }
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
			indicator: function(mtFetch) { return mtFetch.currentIndicator(); },
			indicators: function(mtFetch) { return mtFetch.indicators(); },
			types: function(mtFetch) { return mtFetch.types(); },
			themes: function(mtFetch) { return mtFetch.themes(); }
		}
	});

	$routeProvider.when('/indicators/:indicatorId/reporting', {
		templateUrl: 'partials/indicators/reporting.html',
		controller: 'IndicatorReportingController',
		resolve: {
			indicator: function(mtFetch) { return mtFetch.currentIndicator(); },
			projects: function($route, mtFetch) {
				return mtFetch.projectsByIndicator($route.current.params.indicatorId);
			}
		}
	});

	$routeProvider.when('/themes', {
		templateUrl: 'partials/indicators/theme-list.html',
		controller: 'ThemeListController',
		resolve: {
			themes: function(mtFetch) { return mtFetch.themes(); }
		}
	});

	$routeProvider.when('/types', {
		templateUrl: 'partials/indicators/type-list.html',
		controller: 'TypeListController',
		resolve: {
			types: function(mtFetch) { return mtFetch.types(); }
		}
	});

	$routeProvider.otherwise({
		redirectTo: '/projects'
	});
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['MonitoolApp']);
});

