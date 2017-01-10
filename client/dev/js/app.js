"use strict";

var app = angular.module('monitool.app', [

	'monitool.controllers.admin',
	'monitool.controllers.helper',
	'monitool.controllers.indicator',
	'monitool.controllers.project.shared',
	'monitool.controllers.project.structure',
	'monitool.controllers.project.input',
	'monitool.controllers.project.reporting',

	'monitool.directives.acl',
	'monitool.directives.formControls',
	'monitool.directives.formHelpers',
	'monitool.directives.formValidators',
	'monitool.directives.shared',
	'monitool.directives.pdfExport',
	'monitool.directives.reporting',

	'monitool.filters.shared',

	'monitool.services.models.indicator',
	'monitool.services.models.input',
	'monitool.services.models.project',
	'monitool.services.models.theme',
	'monitool.services.models.user',

	'monitool.services.statistics.olap',
	'monitool.services.statistics.parser',
	'monitool.services.statistics.reporting',

	'monitool.services.utils.itertools',
	'monitool.services.utils.string',
	'monitool.services.utils.translate',
	'monitool.services.utils.uuid',

	'ngCookies',
	'ngResource',
	'ng-sortable',
	
	'pascalprecht.translate',
	'ui.bootstrap',
	'ui.router',
	'ui.select',
]);

/**
 * Init translation modules
 */
app.config(function($translateProvider) {
	$translateProvider.translations('fr', FRENCH_TRANSLATION);
	$translateProvider.translations('en', ENGLISH_TRANSLATION);
	$translateProvider.translations('es', SPANISH_TRANSLATION);

	$translateProvider.useLocalStorage();
	$translateProvider.preferredLanguage('fr');
	$translateProvider.useSanitizeValueStrategy('escapeParameters');
});


app.run(function($rootScope) {
	$rootScope.userCtx = window.user;
});

app.run(function($translate, $rootScope, $locale) {
	var langKey = $translate.use();
	
	$rootScope.languages = {fr: "french", en: "english", es: 'spanish'};
	$rootScope.language = langKey;
	
	if (langKey == 'fr')
		angular.copy(FRENCH_LOCALE, $locale);
	else if (langKey == 'es')
		angular.copy(SPANISH_LOCALE, $locale);
	else
		angular.copy(ENGLISH_LOCALE, $locale);

	$rootScope.$broadcast('$localeChangeSuccess', langKey, $locale);
});

/**
 * Init datepicker modules
 */
app.config(function(uibDatepickerConfig, uibDatepickerPopupConfig) {
	uibDatepickerConfig.showWeeks = false;
	uibDatepickerConfig.startingDay = 1;
	uibDatepickerPopupConfig.showButtonBar = false;
});

/**
 * Transform all dates that come from the server to date objects, and back
 * Remove all properties prefixed by "__" when submitting to server
 * (which allow us to add helper properties on objects, and not submit them).
 */
app.config(function($httpProvider) {

	$httpProvider.defaults.transformRequest.unshift(function(data) {
		if (!data)
			return data;

		// FIXME this method is misnamed (it also remove virtual properties)
		var stringifyDates = function(model) {
			// transform dates
			if (Object.prototype.toString.call(model) === '[object Date]')
				return model.toISOString().substring(0, 10);

			// recurse
			if (Array.isArray(model)) {
				var numChildren = model.length;
				for (var i = 0; i < numChildren; ++i)
					model[i] = stringifyDates(model[i]);
			}
			else if (typeof model === 'object' && model !== null) {
				for (var key in model) {
					if (key.charAt(0) !== '$' && model.hasOwnProperty && model.hasOwnProperty(key)) {
						// remove virtual properties
						if (key.substring(0, 2) === '__')
							delete model[key];
						else
							model[key] = stringifyDates(model[key]);
					}
				}
			}

			return model;
		};

		data = angular.copy(data); // we don't want to change the original one do avoid breaking the display.
		data = stringifyDates(data); // stringify all dates
		data = JSON.parse(angular.toJson(data)); // remove angular $$hashKeys
		return data;
	});

	$httpProvider.defaults.transformResponse.push(function(data, headersGetter, status) {
		
		var needParsing = function(model) {
			return model.type !== 'input' && model.type !== 'cubes';
		};

		var parseDatesRec = function(model) {
			if (typeof model === 'string' && model.match(/^\d\d\d\d\-\d\d\-\d\d$/)) {
				// Using new Date('2010-01-01') <=> new Date('2010-01-01T00:00:00Z')
				// => we want a date that works in UTC.
				return new Date(model + 'T00:00:00Z');
			}

			if (Array.isArray(model)) {
				var numChildren = model.length;
				for (var i = 0; i < numChildren; ++i)
					model[i] = parseDatesRec(model[i]);
			}
			else if (typeof model === 'object' && model !== null) {
				for (var key in model) {
					if (key !== 'period') {
						model[key] = parseDatesRec(model[key]);
					}
				}
			}

			return model;
		};

		return needParsing(data) ? parseDatesRec(data) : data;
	});
});

app.config(function($stateProvider, $urlRouterProvider) {

	///////////////////////////
	// redirects
	///////////////////////////

	$urlRouterProvider.otherwise('/home');

	///////////////////////////
	// states
	///////////////////////////
	
	$stateProvider.state('main', {
		abstract: true,
		controller: 'MainMenuController',
		templateUrl: 'partials/menu.html'
	});

	///////////////////////////
	// Admin
	///////////////////////////

	if (window.user.type == 'user') {
		$stateProvider.state('main.admin', {
			abstract: true,
			templateUrl: 'partials/admin/menu.html'
		});

		$stateProvider.state('main.admin.users', {
			controller: 'UserListController',
			url: '/admin/users',
			templateUrl: 'partials/admin/user-list.html',
			resolve: {
				users: function(User) {
					return User.query().$promise;
				}
			}
		});
		
		$stateProvider.state('main.admin.theme_list', {
			url: '/admin/themes',
			templateUrl: 'partials/admin/theme-list.html',
			controller: 'ThemeListController',
			resolve: {
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});

		$stateProvider.state('main.admin.indicator_list', {
			url: '/admin/indicators',
			templateUrl: 'partials/admin/indicator-list.html',
			controller: 'AdminIndicatorListController',
			resolve: {
				indicators: function(Indicator) {
					return Indicator.query().$promise;
				},
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});
	}

	///////////////////////////
	// Project
	///////////////////////////

	$stateProvider.state('main.home', {
		url: '/home',
		templateUrl: 'partials/home.html',
		controller: 'HomeController'
	});

	if (window.user.type == 'user')
		$stateProvider.state('main.projects', {
			url: '/projects',
			templateUrl: 'partials/projects/list.html',
			controller: 'ProjectListController',
			resolve: {
				projects: function(Project) {
					return Project.query({mode: 'short'}).$promise;
				},
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});

	$stateProvider.state('main.project', {
		abstract: true,
		url: window.user.type == 'user' ? '/projects/:projectId' : '/project',
		controller: 'ProjectMenuController',
		templateUrl: 'partials/projects/menu.html',
		resolve: {
			project: function(Project, $rootScope, $stateParams, $q) {
				// If partner account, we retrieve the projectId from profile, else from URL.
				var projectId = $rootScope.userCtx.type === 'user' ? $stateParams.projectId : $rootScope.userCtx.projectId;

				return Project.get({id: projectId}).$promise.catch(function(e) {
					// Project creation
					if (e.status !== 404)
						return $q.reject(e);

					var project = new Project();
					project._id = projectId;
					project.reset();
					project.users.push({ type: "internal", id: $rootScope.userCtx._id, role: "owner" });
					return $q.when(project);
				});
			},
			indicators: function(project, Indicator) {
				return Indicator.query().$promise;
			},
			themes: function(Theme) {
				return Theme.query().$promise;
			}
		}
	});

	///////////////////////////
	// Project Structure
	///////////////////////////

	$stateProvider.state('main.project.structure', {
		abstract: true,
		controller: 'ProjectEditController',
		templateUrl: 'partials/projects/structure/menu.html'
	});

	$stateProvider.state('main.project.structure.basics', {
		url: '/basics',
		templateUrl: 'partials/projects/structure/basics.html',
		controller: 'ProjectBasicsController'
	});

	$stateProvider.state('main.project.structure.collection_site_list', {
		url: '/sites',
		templateUrl: 'partials/projects/structure/collection-site-list.html',
		controller: 'ProjectCollectionSiteListController'
	});

	$stateProvider.state('main.project.structure.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/structure/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			users: function(User) {
				return User.query().$promise;
			}
		}
	});

	$stateProvider.state('main.project.structure.collection_form_list', {
		url: '/data-source',
		templateUrl: 'partials/projects/structure/collection-form-list.html',
		controller: 'ProjectCollectionFormListController'
	});

	$stateProvider.state('main.project.structure.collection_form_edition', {
		url: '/data-source/:formId',
		templateUrl: 'partials/projects/structure/collection-form-edition.html',
		controller: 'ProjectCollectionFormEditionController',
		resolve: {
			formUsage: function($stateParams, project, Input) {
				return Input.query({mode: "ids_by_form", projectId: project._id, formId: $stateParams.formId}).$promise;
			}
		}
	});

	$stateProvider.state('main.project.structure.cross_cutting', {
		url: '/cross-cutting',
		templateUrl: 'partials/projects/structure/cross-cutting.html',
		controller: 'ProjectCrossCuttingController',
	});
	
	$stateProvider.state('main.project.structure.extra', {
		url: '/extra',
		templateUrl: 'partials/projects/structure/extra-indicators.html',
		controller: 'ProjectExtraIndicators',
	});

	$stateProvider.state('main.project.structure.logical_frame_list', {
		url: '/logical-frame',
		templateUrl: 'partials/projects/structure/logframe-list.html',
		controller: 'ProjectLogicalFrameListController'
	});

	$stateProvider.state('main.project.structure.logical_frame_edition', {
		url: '/logical-frame/:index',
		templateUrl: 'partials/projects/structure/logframe-edit.html',
		controller: 'ProjectLogicalFrameEditController'
	});



	///////////////////////////
	// Project Input
	///////////////////////////


	$stateProvider.state('main.project.input', {
		abstract: true,
		url: '/input/:formId',
		template: '<div ui-view></div>',
	});

	$stateProvider.state('main.project.input.list', {
		url: '/list',
		templateUrl: 'partials/projects/input/collection-input-list.html',
		controller: 'ProjectCollectionInputListController',
		resolve: {
			inputsStatus: function(Input, project, $stateParams) {
				return Input.fetchFormStatus(project, $stateParams.formId);
			}
		}
	});

	$stateProvider.state('main.project.input.edit', {
		url: '/edit/:period/:entityId',
		templateUrl: 'partials/projects/input/collection-input-edition.html',
		controller: 'ProjectCollectionInputEditionController',
		resolve: {
			inputs: function(Input, $stateParams, project) {
				return Input.fetchLasts(project, $stateParams.entityId, $stateParams.formId, $stateParams.period);
			}
		}
	});

	///////////////////////////
	// Project Reporting
	///////////////////////////

	$stateProvider.state('main.project.reporting', {
		abstract: true,
		url: '/reporting',
		template: '<div ui-view></div>',
		resolve: {
			cubes: function(Cube, project) {
				return Cube.fetchProject(project._id).then(function(cs) {
					var byid = {};
					cs.forEach(function(c) { byid[c.id] = c; });
					return byid;
				});
			}
		}
	});

	$stateProvider.state('main.project.reporting.general', {
		url: '/general',
		templateUrl: 'partials/projects/reporting/reporting.html',
		controller: 'ProjectReportingController',
	});

	$stateProvider.state('main.project.reporting.detailed', {
		url: '/detailed',
		templateUrl: 'partials/projects/reporting/reporting-detailed.html',
		controller: 'ProjectDetailedReportingController'
	});

	$stateProvider.state('main.project.reporting.olap', {
		url: '/olap',
		templateUrl: 'partials/projects/reporting/olap.html',
		controller: 'ProjectOlapController'
	});


	///////////////////////////
	// Indicators
	///////////////////////////
	

	///////////////////////////
	// Indicator
	///////////////////////////

	if (window.user.type == 'user') {

		$stateProvider.state('main.indicators', {
			url: '/indicators',
			templateUrl: 'partials/indicators/list.html',
			controller: 'IndicatorListController',
			resolve: {
				indicators: function(Indicator) {
					return Indicator.query().$promise;
				},
				themes: function(Theme) {
					return Theme.query().$promise;
				}
			}
		});

		$stateProvider.state('main.indicator_reporting', {
			url: '/indicator/:indicatorId',
			templateUrl: 'partials/indicators/reporting.html',
			controller: 'IndicatorReportingController',
			resolve: {
				themes: function(Theme) {
					return Theme.query().$promise;
				},
				indicator: function(Indicator, $q, $stateParams) {
					return Indicator.get({id: $stateParams.indicatorId}).$promise;
				},
				projects: function(Project, indicator) {
					return Project.query({mode: 'crossCutting', indicatorId: indicator._id});
				},
				cubes: function(Cube, indicator) {
					return Cube.fetchIndicator(indicator._id);
				}
			}
		});
	}

});


app.run(function($rootScope, $state) {
	$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
		if (error.status === 401) {
			alert("Session has expired, you need to log in again");
			window.location.reload();
		}

		console.log(error)
		console.log(error.stack)
	});
});

