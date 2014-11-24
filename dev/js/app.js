"use strict";

var app = angular.module('monitool.app', [
	'ui.router',
	'ngCookies',
	'monitool.controllers.helper',
	'monitool.controllers.indicator',
	'monitool.controllers.project',
	'monitool.directives',
	'monitool.filters',
	'monitool.services.database',
	'monitool.services.fetch',
	'monitool.services.reporting',
	'pascalprecht.translate'
]);

app.config(function($translateProvider) {
	$translateProvider.translations('fr', FRENCH_TRANSLATION);
	$translateProvider.translations('en', ENGLISH_TRANSLATION);
	$translateProvider.translations('es', SPANISH_TRANSLATION);

	$translateProvider.useLocalStorage();
	$translateProvider.preferredLanguage('fr');
});

app.config(function($stateProvider, $urlRouterProvider) {
	///////////////////////////
	// redirects
	///////////////////////////

	$urlRouterProvider.otherwise('/projects');

	///////////////////////////
	// states
	///////////////////////////

	// $stateProvider.state('login', {
	// 	url: '/login',
	// 	controller: 'LoginController',
	// 	templateUrl: 'partials/workflow/login.html'
	// });

	// $stateProvider.state('index', {
	// 	controller: 'MainController',
	// 	url: '/',
	// 	templateUrl: 'partials/main.html'
	// });

	$stateProvider.state('main.login', {
		controller: 'LoginController',
		url: '/login',
		templateUrl: 'partials/login.html'
	});

	$stateProvider.state('main.change_password', {
		controller: 'ChangePasswordController',
		url: '/change-password',
		templateUrl: 'partials/change-password.html',
		resolve: {
			userSession: function(mtDatabase) {
				return mtDatabase.remote.getSession();
			}
		}
	});

	$stateProvider.state('main', {
		abstract: true,
		controller: 'MainMenuController',
		templateUrl: 'partials/menu.html'
	});

	///////////////////////////
	// Help
	///////////////////////////

	$stateProvider.state('main.help', {
		abstract: true,
		templateUrl: 'partials/help/menu.html'
	});

	$stateProvider.state('main.help.monitoring', {
		url: '/help/monitoring',
		templateUrl: 'partials/help/monitoring.html'
	});

	$stateProvider.state('main.help.documentation', {
		url: '/help/documentation',
		templateUrl: 'partials/help/documentation.html'
	});

	///////////////////////////
	// Project
	///////////////////////////

	$stateProvider.state('main.projects', {
		url: '/projects',
		templateUrl: 'partials/projects/list.html',
		controller: 'ProjectListController',
		resolve: {
			projects: function(mtFetch) { return mtFetch.projects(); }
		}
	});

	$stateProvider.state('main.project', {
		abstract: true,
		url: '/projects/:projectId',
		controller: 'ProjectMenuController',
		templateUrl: 'partials/projects/menu.html',
		resolve: {
			project: function(mtFetch, $stateParams) {
				return mtFetch.project($stateParams.projectId);
			}
		}
	});

	$stateProvider.state('main.project.logical_frame', {
		url: '/logical-frame',
		templateUrl: 'partials/projects/logical-frame.html',
		controller: 'ProjectLogicalFrameController',
		resolve: {
			indicatorsById: function(project, mtDatabase) {
				var ids = Object.keys(project.indicators);
				if (ids.length)
					return mtDatabase.current.query('monitool/indicators_short', {group: true, keys: ids}).then(function(result) {
						var indicatorsById = {};
						result.rows.forEach(function(row) { indicatorsById[row.key] = row.value; });
						return indicatorsById;
					});
				else
					return {};
			}
		}
	});

	$stateProvider.state('main.project.input_entities', {
		url: '/input-entities',
		templateUrl: 'partials/projects/input-entities.html',
		controller: 'ProjectInputEntitiesController'
	});

	$stateProvider.state('main.project.input_entities_reporting', {
		url: '/input-entities/:entityId',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'entity'; },
		}
	});

	$stateProvider.state('main.project.input_groups', {
		url: '/input-groups',
		templateUrl: 'partials/projects/input-groups.html',
		controller: 'ProjectInputGroupsController'
	});

	$stateProvider.state('main.project.input_groups_reporting', {
		url: '/input-groups/:groupId',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'group'; },
		}
	});

	$stateProvider.state('main.project.forms', {
		url: '/forms',
		templateUrl: 'partials/projects/form-list.html',
		controller: 'ProjectFormsController'
	});

	$stateProvider.state('main.project.form', {
		url: '/forms/:formId',
		templateUrl: 'partials/projects/form-edit.html',
		controller: 'ProjectFormEditionController'
	});

	$stateProvider.state('main.project.input_list', {
		url: '/inputs',
		templateUrl: 'partials/projects/input-list.html',
		controller: 'ProjectInputListController',
		resolve: {
			inputs: function($stateParams, mtDatabase) {
				return mtDatabase.current.allDocs({
					startkey: $stateParams.projectId + ':',
					endkey: $stateParams.projectId + ':~'
				}).then(function(result) {
					var i = {};
					result.rows.forEach(function(row) { i[row.id] = true; });
					return i;
				});
			}
		}
	});

	$stateProvider.state('main.project.input', {
		url: '/input/:period/:formId/:entityId',
		templateUrl: 'partials/projects/input.html',
		controller: 'ProjectInputController',
		resolve: {
			inputs: function(mtFetch, $stateParams) { return mtFetch.currentPreviousInput($stateParams); }
		}
	});

	$stateProvider.state('main.project.reporting', {
		url: '/reporting',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ReportingController',
		resolve: {
			type: function() { return 'project'; },
		}
	});

	$stateProvider.state('main.project.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
	});

	///////////////////////////
	// Indicators
	///////////////////////////

	$stateProvider.state('main.indicators', {
		abstract: true,
		templateUrl: 'partials/indicators/menu.html'
	});

	$stateProvider.state('main.indicators.list', {
		url: '/indicators',
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController',
		resolve: {
			indicatorHierarchy: function(mtFetch) { return mtFetch.indicatorHierarchy(); },
			typesById: function(mtFetch) { return mtFetch.typesById(); },
			themesById: function(mtFetch) { return mtFetch.themesById(); }
		}
	});

	$stateProvider.state('main.indicators.theme_list', {
		url: '/themes',
		templateUrl: 'partials/indicators/theme-type-list.html',
		controller: 'ThemeTypeListController',
		resolve: {
			entities: function(mtFetch) { return mtFetch.themes(); },
			entityType: function() { return 'theme'; }
		}
	});

	$stateProvider.state('main.indicators.type_list', {
		url: '/types',
		templateUrl: 'partials/indicators/theme-type-list.html',
		controller: 'ThemeTypeListController',
		resolve: {
			entities: function(mtFetch) { return mtFetch.types(); },
			entityType: function() { return 'type'; }
		}
	});

	///////////////////////////
	// Indicator
	///////////////////////////

	$stateProvider.state('main.indicator', {
		abstract: true,
		url: '/indicator/:indicatorId',
		template: '<div ui-view></div>',
		resolve: {
			indicator: function(mtFetch, $stateParams) { return mtFetch.indicator($stateParams.indicatorId); }
		}
	});

	$stateProvider.state('main.indicator.edit', {
		url: '/edit',
		templateUrl: 'partials/indicators/edit.html',
		controller: 'IndicatorEditController',
		resolve: {
			indicators: function(mtFetch) { return mtFetch.indicators(); },
			types: function(mtFetch) { return mtFetch.types(); },
			themes: function(mtFetch) { return mtFetch.themes(); }
		}
	});

	$stateProvider.state('main.indicator.reporting', {
		url: '/reporting',
		templateUrl: 'partials/indicators/reporting.html',
		controller: 'IndicatorReportingController',
		resolve: {
			projects: function($stateParams, mtFetch) {
				return mtFetch.projectsByIndicator($stateParams.indicatorId);
			}
		}
	});


});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['monitool.app']);
});

