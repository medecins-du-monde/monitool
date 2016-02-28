"use strict";

var app = angular.module('monitool.app', [

	'monitool.controllers.admin',
	'monitool.controllers.helper',
	'monitool.controllers.indicator',
	'monitool.controllers.project.shared',
	'monitool.controllers.project.activity',
	'monitool.controllers.project.indicators',
	'monitool.controllers.project.spec',

	'monitool.directives.acl',
	'monitool.directives.form',
	'monitool.directives.shared',
	
	'monitool.directives.indicatorForm',
	'monitool.directives.projectLogframe',
	'monitool.directives.reporting',

	'monitool.filters.shared',
	'monitool.filters.indicator',

	'monitool.services.fetch',
	'monitool.services.itertools',
	'monitool.services.reporting',
	'monitool.services.string',
	'monitool.services.models.input',
	
	'angularMoment',
	'ngCookies',
	'ngResource',
	'pascalprecht.translate',
	// 'textAngular',
	'ui.bootstrap',
	'ui.bootstrap.showErrors',
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
});


app.run(function($rootScope) {
	$rootScope.userCtx = window.user;
});

app.run(function($translate, $locale, $rootScope) {
	var langKey = $translate.use();
	
	$rootScope.languages = {fr: "french", en: "english", es: 'spanish'};
	$rootScope.language = langKey;
	
	if (langKey == 'fr')
		angular.copy(FRENCH_LOCALE, $locale);
	else if (langKey == 'es')
		angular.copy(SPANISH_LOCALE, $locale);
	else
		angular.copy(ENGLISH_LOCALE, $locale);
});

/**
 * Init datepicker modules
 */
app.config(function(datepickerConfig, datepickerPopupConfig) {
	datepickerConfig.showWeeks = false;
	datepickerConfig.startingDay = 1;
	datepickerPopupConfig.showButtonBar = false;
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
				return moment(model).format('YYYY-MM-DD');

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

	$httpProvider.defaults.transformResponse.push(function(data) {
		var parseDatesRec = function(model) {
			if (typeof model === 'string' && model.match(/^\d\d\d\d\-\d\d\-\d\d$/))
				return new Date(model);

			if (Array.isArray(model)) {
				var numChildren = model.length;
				for (var i = 0; i < numChildren; ++i)
					model[i] = parseDatesRec(model[i]);
			}
			else if (typeof model === 'object' && model !== null) {
				for (var key in model)
					model[key] = parseDatesRec(model[key]);
			}

			return model;
		};

		return parseDatesRec(data);
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
		templateUrl: window.user.type == 'user' ? 'partials/menu.html' : 'partials/menu-single-project.html'
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
			controller: 'UsersController',
			url: '/admin/users',
			templateUrl: 'partials/admin/users.html',
			resolve: {
				users: function(mtFetch) {
					return mtFetch.users();
				}
			}
		});
		
		$stateProvider.state('main.admin.theme_list', {
			url: '/admin/themes',
			templateUrl: 'partials/admin/theme-type-list.html',
			controller: 'ThemeTypeListController',
			resolve: {
				entities: function(mtFetch) {
					return mtFetch.themes({with_counts: 1});
				}
			},
			data: {
				entityType: 'theme'
			}
		});

		$stateProvider.state('main.admin.type_list', {
			url: '/admin/types',
			templateUrl: 'partials/admin/theme-type-list.html',
			controller: 'ThemeTypeListController',
			resolve: {
				entities: function(mtFetch) {
					return mtFetch.types({with_counts: 1});
				}
			},
			data: {
				entityType: 'type'
			}
		});
	}

	///////////////////////////
	// Project
	///////////////////////////

	$stateProvider.state('main.home', {
		url: '/home',
		templateUrl: 'partials/home.html',
		controller: 'HomeController',
		resolve: {
		}
	});


	if (window.user.type == 'user') {
		$stateProvider.state('main.projects', {
			url: '/projects',
			templateUrl: 'partials/projects/list.html',
			controller: 'ProjectListController',
			resolve: {
				projects: function(mtFetch) { return mtFetch.projects({mode: 'list'}); },
				themes: function(mtFetch) { return mtFetch.themes({}); }
			}
		});
	}

	$stateProvider.state('main.project', {
		abstract: true,
		url: window.user.type == 'user' ? '/projects/:projectId' : '/project',
		controller: 'ProjectMenuController',
		templateUrl: 'partials/projects/menu.html',
		resolve: {
			project: function(mtFetch, $rootScope, $stateParams) {
				if ($rootScope.userCtx.type == 'user')
					return mtFetch.project($stateParams.projectId);
				else
					return mtFetch.project($rootScope.userCtx.projectId);
			}
		}
	});


	///////////////////////////
	// Project Specification
	///////////////////////////

	$stateProvider.state('main.project.basics', {
		url: '/basics',
		templateUrl: 'partials/projects/specification/basics.html',
		controller: 'ProjectBasicsController',
		resolve: {
			themes: function(mtFetch) {
				return mtFetch.themes();
			}
		}
	});

	$stateProvider.state('main.project.collection_site_list', {
		url: '/collection-site',
		templateUrl: 'partials/projects/specification/collection-site-list.html',
		controller: 'ProjectCollectionSiteListController'
	});


	$stateProvider.state('main.project.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/specification/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			users: function(mtFetch) {
				return mtFetch.users();
			}
		}
	});

	///////////////////////////
	// Project Raw data
	///////////////////////////

	$stateProvider.state('main.project.collection_form_list', {
		url: '/collection-form',
		templateUrl: 'partials/projects/activity/collection-form-list.html',
		controller: 'ProjectCollectionFormListController'
	});

	$stateProvider.state('main.project.collection_form_edition', {
		url: '/collection-form/:formId',
		templateUrl: 'partials/projects/activity/collection-form-edition.html',
		controller: 'ProjectCollectionFormEditionController',
		resolve: {
			form: function($stateParams, project) {
				if ($stateParams.formId === 'new')
					return {
						id: makeUUID(),
						name: '',
						periodicity: 'month', 
						collect: 'entity',
						start: null,
						end: null,
						active: true,
						elements: []
					};
				else
					return project.forms.find(function(form) {
						return form.id == $stateParams.formId;
					});
			},
			formUsage: function(form, Input) {
				return Input.query({mode: "ids_by_form", formId: form.id}).$promise;
			}
		}
	});

	$stateProvider.state('main.project.collection_input_list', {
		url: '/collection-input',
		templateUrl: 'partials/projects/activity/collection-input-list.html',
		controller: 'ProjectCollectionInputListController',
		resolve: {
			inputsStatus: function(Input, project) {
				return Input.fetchProjectStatus(project);
			}
		}
	});

	$stateProvider.state('main.project.collection_input_edition', {
		url: '/collection-input/:period/:formId/:entityId',
		templateUrl: 'partials/projects/activity/collection-input-edition.html',
		controller: 'ProjectCollectionInputEditionController',
		resolve: {
			inputs: function(Input, $stateParams, project) {
				var form = project.forms.find(function(f) { return f.id == $stateParams.formId});
				return Input.fetchLasts(project._id, $stateParams.entityId, form, $stateParams.period);
			},
			form: function($stateParams, project) {
				return project.forms.find(function(form) { return form.id == $stateParams.formId; });
			}
		}
	});

	$stateProvider.state('main.project.activity_reporting', {
		url: '/activity-reporting',
		templateUrl: 'partials/projects/activity/reporting.html',
		controller: 'ProjectActivityReportingController',
		resolve: {
			inputs: function(Input, project) {
				return Input.fetchForProject(project);
			}
		}
	});

	$stateProvider.state('main.project.detailed_activity_reporting', {
		url: '/detailed-activity-reporting',
		templateUrl: 'partials/projects/activity/reporting-detailed.html',
		controller: 'ProjectActivityDetailedReportingController',
		resolve: {
			inputs: function(Input, project) {
				return Input.fetchForProject(project);
			}
		}
	});

	$stateProvider.state('main.project.olap', {
		url: '/olap',
		templateUrl: 'partials/projects/activity/olap.html',
		controller: 'ProjectActivityOlapController',
		resolve: {
			inputs: function(Input, project) {
				return Input.fetchForProject(project);
			}
		}
	});


	///////////////////////////
	// Project Indicators
	///////////////////////////

	$stateProvider.state('main.project.logical_frame', {
		url: '/logical-frame',
		templateUrl: 'partials/projects/indicators/logframe-edit.html',
		controller: 'ProjectLogicalFrameController'
	});

	$stateProvider.state('main.project.indicator_selection', {
		url: '/indicator-selection',
		templateUrl: 'partials/projects/indicators/selection.html',
		controller: 'ProjectIndicatorSelectionController'
	});

	$stateProvider.state('main.project.indicators_reporting', {
		url: '/indicator-reporting',
		templateUrl: 'partials/projects/indicators/reporting.html',
		controller: 'ProjectReportingController',
		resolve: {
			inputs: function(Input, project) {
				return Input.fetchForProject(project);
			}
		}
	});

	$stateProvider.state('main.project.detailed_indicators_reporting', {
		url: '/detailed-indicator-reporting',
		templateUrl: 'partials/projects/indicators/reporting-detailed.html',
		controller: 'ProjectDetailedReportingController',
		resolve: {
			inputs: function(Input, project) {
				return Input.fetchForProject(project);
			}
		}
	});

	// $stateProvider.state('main.project.reporting_analysis_list', {
	// 	url: '/reporting-analysis-list',
	// 	templateUrl: 'partials/projects/indicators/analysis-list.html',
	// 	controller: 'ProjectReportingAnalysisListController',
	// 	resolve: {
	// 		reports: function(mtFetch, $stateParams) {
	// 			return mtFetch.reports({mode: "dates_only", projectId: $stateParams.projectId});
	// 		}
	// 	}
	// });

	// $stateProvider.state('main.project.reporting_analysis', {
	// 	url: '/reporting-analysis/:reportId',
	// 	templateUrl: 'partials/projects/indicators/analysis.html',
	// 	controller: 'ProjectReportingAnalysisController',
	// 	resolve: {
	// 		report: function(mtFetch, $stateParams) {
	// 			var report = mtFetch.report($stateParams.reportId);
	// 			if ($stateParams.reportId === 'new')
	// 				report.project = $stateParams.projectId;
	// 			return report;
	// 		}
	// 	}
	// });

	///////////////////////////
	// Indicators
	///////////////////////////
	
	$stateProvider.state('main.indicators', {
		url: '/indicators',
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController',
		resolve: {
			hierarchy: function(mtFetch) { return mtFetch.themes({mode: 'tree'}); }
		}
	});

	///////////////////////////
	// Indicator
	///////////////////////////

	if (window.user.type == 'user') {
		$stateProvider.state('main.indicator', {
			abstract: true,
			url: '/indicator/:indicatorId',
			template: '<div ui-view></div>',
			resolve: {
				indicator: function(mtFetch, $stateParams) {
					return mtFetch.indicator($stateParams.indicatorId);
				}
			}
		});

		$stateProvider.state('main.indicator.edit', {
			url: '/edit',
			templateUrl: 'partials/indicators/edit.html',
			controller: 'IndicatorEditController',
			resolve: {
				types: function(mtFetch) {
					return mtFetch.types();
				},
				themes: function(mtFetch) {
					return mtFetch.themes();
				}
			}
		});

		$stateProvider.state('main.indicator.reporting', {
			url: '/reporting',
			templateUrl: 'partials/indicators/reporting.html',
			controller: 'IndicatorReportingController',
			resolve: {
				projects: function($stateParams, mtFetch) {
					return mtFetch.projects({mode: "indicator_reporting", indicatorId: $stateParams.indicatorId});
				},
				inputs: function(Input, projects) {
					return Input.fetchForProjects(projects);
				}
			}
		});
	}

	///////////////////////////
	// Help
	///////////////////////////

	$stateProvider.state('main.help', {
		abstract: true,
		controller: 'HelpMenuController',
		url: '/help',
		templateUrl: 'partials/help/menu.html',
	});

	$stateProvider.state('main.help.presentation_general', {
		controller: 'HelpController',
		url: "/presentation_general",
		templateUrl: 'partials/help/00-presentation_general.html'
	});

	$stateProvider.state('main.help.data_path', {
		controller: 'HelpController',
		url: "/data_path",
		templateUrl: 'partials/help/01-data_path.html'
	});

	if (window.user.type == 'user') {
		$stateProvider.state('main.help.create', {
			controller: 'HelpController',
			url: "/create",
			templateUrl: 'partials/help/02-create.html'
		});
	}

	$stateProvider.state('main.help.structure', {
		controller: 'HelpController',
		url: "/structure",
		templateUrl: 'partials/help/03-structure.html'
	});

	$stateProvider.state('main.help.input', {
		controller: 'HelpController',
		url: "/input",
		templateUrl: 'partials/help/04-input.html'
	});

	$stateProvider.state('main.help.activity_followup', {
		controller: 'HelpController',
		url: "/activity-followup",
		templateUrl: 'partials/help/05-activity-followup.html'
	});

	$stateProvider.state('main.help.logical_frame', {
		controller: 'HelpController',
		url: "/logical-frame",
		templateUrl: 'partials/help/06-logical-frame.html'
	});

	$stateProvider.state('main.help.objectives_results', {
		controller: 'HelpController',
		url: "/objectives-results",
		templateUrl: 'partials/help/07-objectives-results.html'
	});

	$stateProvider.state('main.help.change_definition', {
		controller: 'HelpController',
		url: "/change-definition",
		templateUrl: 'partials/help/08-change-definition.html'
	});

	if (window.user.type == 'user') {
		$stateProvider.state('main.help.indicator_usage', {
			controller: 'HelpController',
			url: "/indicator-usage",
			templateUrl: 'partials/help/09-indicator-usage.html'
		});

		$stateProvider.state('main.help.create_new_indicator', {
			controller: 'HelpController',
			url: "/create-new-indicator",
			templateUrl: 'partials/help/10-create-new-indicator.html'
		});

		$stateProvider.state('main.help.merge_indicators', {
			controller: 'HelpController',
			url: "/merge-indicators",
			templateUrl: 'partials/help/11-merge-indicators.html'
		});

		$stateProvider.state('main.help.indicator_reporting', {
			controller: 'HelpController',
			url: "/indicator-reporting",
			templateUrl: 'partials/help/12-indicator-reporting.html'
		});
	}
});


app.run(function($rootScope, $state, mtFetch) {
	$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
		console.log(error)
		console.log(error.stack)
	});
});

