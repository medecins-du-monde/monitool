"use strict";

var app = angular.module('MonitoolApp', ['ngRoute', 'MonitoolControllers', 'MonitoolDirectives']);

app.config(function($routeProvider) {

	///////////////////////////
	// Project
	///////////////////////////

	$routeProvider.when('/projects', {
		templateUrl: 'partials/projects/list.html',
		controller: 'ProjectListController',
		resolve: {
			projects: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {include_docs: true, key: 'project'}).then(function(projects) {
					return projects.rows.map(function(row) { return row.doc; });
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId/description', {
		templateUrl: 'partials/projects/description.html',
		controller: 'ProjectDescriptionController',
		resolve: {
			project: function($route, $q, mtDatabase) {
				if ($route.current.params.projectId === 'new')
					return $q.when({type: 'project', planning: {}, center: {}});
				else
					return mtDatabase.get($route.current.params.projectId);
			}
		}
	});

	$routeProvider.when('/projects/:projectId/centers', {
		templateUrl: 'partials/projects/center-list.html',
		controller: 'ProjectCenterListController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			},
			inputsByCenterId: function($route, mtDatabase) {
				var view = 'monitool/num_inputs_by_project_center',
					options = {
						startkey: [$route.current.params.projectId],
						endkey: [$route.current.params.projectId, {}],
						group: true, group_level: 2
					};

				return mtDatabase.query(view, options).then(function(result) {
					var usage = {};
					result.rows.forEach(function(row) {
						usage[row.key[1]] = row.value;
					});
					return usage;
				});
			},
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

	$routeProvider.when('/projects/:projectId/plannings', {
		templateUrl: 'partials/projects/planning-list.html',
		controller: 'ProjectPlanningListController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			},
			indicators: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId).then(function(project) {
					var options = {keys: Object.keys(project.planning || {}), include_docs: true};
					return mtDatabase.allDocs(options).then(function(result) {
						var indicators = {};
						result.rows.forEach(function(indicator) {
							indicators[indicator.id] = indicator.doc;
						});
						return indicators;
					});
				})
			},
			inputsByIndicatorId: function($route, mtDatabase) {
				var view = 'monitool/num_inputs_by_project_indicator',
					options = {
						startkey: [$route.current.params.projectId],
						endkey: [$route.current.params.projectId, {}],
						group: true, group_level: 2
					};

				return mtDatabase.query(view, options).then(function(result) {
					var usage = {};
					result.rows.forEach(function(row) {
						usage[row.key[1]] = row.value;
					});
					return usage;
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId/plannings/:indicatorId', {
		templateUrl: 'partials/projects/planning-edit.html',
		controller: 'ProjectPlanningEditController',
		resolve: {
			project: function($route, mtDatabase) {
				return mtDatabase.get($route.current.params.projectId);
			},
			indicators: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'indicator', include_docs: true}).then(function(result) {
					return result.rows.map(function(row) { return row.doc; })
				});
			},
			types: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'type', include_docs: true}).then(function(result) {
					return result.rows.map(function(row) { return row.doc; });
				});
			},
			themes: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'theme', include_docs: true}).then(function(result) {
					return result.rows.map(function(row) { return row.doc; });
				});
			}
		}
	});

	$routeProvider.when('/projects/:projectId', {
		redirectTo: '/projects/:projectId/description'
	});

	///////////////////////////
	// Indicators
	///////////////////////////

	$routeProvider.when('/indicators', {
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController',
		resolve: {
			hierarchy: function($q, mtDatabase) {
				return $q.all([
					mtDatabase.query('monitool/by_type', {key: 'indicator', include_docs: true}),
					mtDatabase.query('monitool/by_type', {key: 'type', include_docs: true}),
					mtDatabase.query('monitool/by_type', {key: 'theme', include_docs: true}),
					mtDatabase.query('monitool/indicator_usage', {group: true})
				]).then(function(result) {
					var scope = {};
					var usage = {};
					result[3].rows.forEach(function(row) { usage[row.key] = row.value; });

					scope.hierarchy = {};
					result[0].rows.forEach(function(row) {
						var indicator = row.doc;
						indicator.usage = usage[indicator._id] || 0;

						if (!indicator.themes.length)
							indicator.themes.push('');

						if (!indicator.types.length)
							indicator.types.push('');

						indicator.themes.forEach(function(theme) {
							indicator.types.forEach(function(type) {
								if (!scope.hierarchy[theme])
									scope.hierarchy[theme] = {};

								if (!scope.hierarchy[theme][type])
									scope.hierarchy[theme][type] = [];

								scope.hierarchy[theme][type].push(indicator);
							});
						});

						return row.doc;
					});

					scope.types  = {};
					scope.themes = {};
					result[1].rows.forEach(function(row) { return scope.types[row.id] = row.doc; });
					result[2].rows.forEach(function(row) { return scope.themes[row.id] = row.doc; });

					return scope;
				});
			}
		}
	});

	$routeProvider.when('/indicators/:indicatorId', {
		templateUrl: 'partials/indicators/edit.html',
		controller: 'IndicatorEditController',
		resolve: {
			indicator: function($route, $q, mtDatabase) {
				if ($route.current.params.indicatorId === 'new') {
					var i = {type: 'indicator', name: '', description: '', history: '', standard: false, sumAllowed: false, types: [], themes: [], formulas: {}};
					return $q.when(i);
				}
				else
					return mtDatabase.get($route.current.params.indicatorId);
			},
			indicators: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'indicator', include_docs: true});
			},
			types: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'type', include_docs: true});
			},
			themes: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'theme', include_docs: true})
			}
		}
	});

	$routeProvider.when('/themes', {
		templateUrl: 'partials/indicators/theme-list.html',
		controller: 'ThemeListController',
		resolve: {
			themes: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'theme', include_docs: true}).then(function(result) {
					return result.rows.map(function(row) { return row.doc; });
				})
			},
			themeUsages: function(mtDatabase) {
				return mtDatabase.query('monitool/theme_usage', {group: true}).then(function(result) {
					var usage = {};
					result.rows.forEach(function(row) {
						usage[row.key] = row.value;
					});
					return usage;
				});
			}
		}
	});

	$routeProvider.when('/types', {
		templateUrl: 'partials/indicators/type-list.html',
		controller: 'TypeListController',
		resolve: {
			types: function(mtDatabase) {
				return mtDatabase.query('monitool/by_type', {key: 'type', include_docs: true}).then(function(result) {
					return result.rows.map(function(row) { return row.doc; });
				});
			},
			typeUsages: function(mtDatabase) {
				return mtDatabase.query('monitool/type_usage', {group: true}).then(function(result) {
					var usage = {};
					result.rows.forEach(function(row) {
						usage[row.key] = row.value;
					});
					return usage;
				});
			}
		}
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



angular.element(document).ready(function() {
	angular.bootstrap(document, ['MonitoolApp']);



});
