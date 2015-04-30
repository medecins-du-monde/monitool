"use strict";

// this has nothing to do on the root scope.
// => move it to a service and factorize with the similiar function in mtReporting
var getPeriods = function(form, project) {
	var periods;
	if (['year', 'quarter', 'month', 'week', 'day'].indexOf(form.periodicity) !== -1) {
		var period = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

		var current = moment(form.useProjectStart ? project.begin : form.start).startOf(period),
			end     = moment(form.useProjectEnd ? project.end : project.end).endOf(period);

		if (end.isAfter()) // do not allow to go in the future
			end = moment();

		periods = [];
		while (current.isBefore(end)) {
			periods.push(current.clone());
			current.add(1, form.periodicity);
		}
	}
	else if (form.periodicity === 'planned') {
		periods = form.intermediaryDates.map(function(period) {
			return moment(period);
		});
		periods.unshift(moment(form.start));
		periods.push(moment(form.end));
	}
	else
		throw new Error(form.periodicity + ' is not a valid periodicity');

	return periods;
};



var app = angular.module('monitool.app', [
	'angularMoment',

	'monitool.controllers.admin',
	'monitool.controllers.helper',
	'monitool.controllers.indicator',
	'monitool.controllers.project',

	'monitool.directives.acl',
	'monitool.directives.form',
	'monitool.directives.shared',
	
	'monitool.directives.indicatorForm',
	'monitool.directives.projectInput',
	'monitool.directives.projectLogframe',
	'monitool.directives.projectForm',
	'monitool.directives.reporting',

	'monitool.filters.shared',
	'monitool.filters.indicator',

	'monitool.services.fetch',
	'monitool.services.reporting',
	'monitool.services.string',
	
	'ngCookies',
	'ngResource',
	'pascalprecht.translate',
	'textAngular',
	'ui.bootstrap',
	'ui.bootstrap.showErrors',
	'ui.router',
	'ui.select',
]);

// Uncomment to add 1 second of latency to every query
// http://blog.brillskills.com/2013/05/simulating-latency-for-angularjs-http-calls-with-response-interceptors/
// 
// app.config(function($httpProvider) {
// 
// 	$httpProvider.responseInterceptors.push(function($q, $timeout) {
// 		return function(promise) {
// 			return promise.then(function(response) {
// 				return $timeout(function() {
// 					return response;
// 				}, 1000);
// 			}, function(response) {
// 				return $q.reject(response);
// 			});
// 		};
// 	});
// });


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

	$urlRouterProvider.otherwise('/projects');

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

	///////////////////////////
	// Project
	///////////////////////////

	$stateProvider.state('main.projects', {
		url: '/projects',
		templateUrl: 'partials/projects/list.html',
		controller: 'ProjectListController',
		resolve: {
			projects: function(mtFetch) { return mtFetch.projects({mode: 'list'}); },
			themes: function(mtFetch) { return mtFetch.themes({}); }
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
			},
			indicatorsById: function(mtFetch, $stateParams) {
				if ($stateParams.projectId !== 'new')
					return mtFetch.indicators({mode: 'project', projectId: $stateParams.projectId}, true);
				else 
					return {};
			}
		}
	});

	$stateProvider.state('main.project.logical_frame', {
		url: '/logical-frame',
		templateUrl: 'partials/projects/logframe/edit.html',
		controller: 'ProjectLogicalFrameController',
		resolve: {
			themes: function(mtFetch) {
				return mtFetch.themes();
			}
		}
	});

	$stateProvider.state('main.project.input_entities', {
		url: '/input-entities',
		templateUrl: 'partials/projects/entities/input-entities.html',
		controller: 'ProjectInputEntitiesController'
	});

	$stateProvider.state('main.project.input_groups', {
		url: '/input-groups',
		templateUrl: 'partials/projects/entities/input-groups.html',
		controller: 'ProjectInputGroupsController'
	});

	$stateProvider.state('main.project.forms', {
		url: '/forms',
		templateUrl: 'partials/projects/planning/list.html',
		controller: 'ProjectFormsController'
	});

	$stateProvider.state('main.project.form', {
		url: '/forms/:formId',
		templateUrl: 'partials/projects/planning/edit.html',
		controller: 'ProjectFormEditionController',
		resolve: {
			form: function($stateParams, project) {
				if ($stateParams.formId === 'new')
					return {
						id: makeUUID(),
						name: '',
						periodicity: 'month', 
						collect: 'entity',
						useProjectStart: true,
						useProjectEnd: true,
						start: project.begin,
						end: project.end,
						intermediaryDates: [],
						active: true,
						rawData: [],
						fields: []
					};
				else
					return project.dataCollection.find(function(form) {
						return form.id == $stateParams.formId;
					});
			}
		}
	});

	$stateProvider.state('main.project.input_list', {
		url: '/inputs',
		templateUrl: 'partials/projects/input/list.html',
		controller: 'ProjectInputListController',
		resolve: {
			// FIXME rewrite or move this. It is way to much code for a controller resolve function.
			inputs: function($stateParams, mtFetch, project) {
				return mtFetch.inputs({mode: 'project_input_ids', projectId: project._id}).then(function(result) {
					// create hash with all existing inputs
					var existingInputs = {};
					result.forEach(function(id) { existingInputs[id] = true; });
					
					var displayedInputs = []

					// iterate on all inputs that should exist according to the project forms (and current date).
					project.dataCollection.forEach(function(form) {
						getPeriods(form, project).forEach(function(period) {
							var inputEntities;
							if (form.collect === 'entity')
								inputEntities = project.inputEntities;
							else if (form.collect === 'project')
								inputEntities = [{id: "none"}];
							else
								throw new Error('Invalid form.collect value.');

							inputEntities.forEach(function(inputEntity) {
								var inputId = [project._id, inputEntity.id, form.id, period.format('YYYY-MM-DD')].join(':');
								if (form.active || existingInputs[inputId])
									displayedInputs.push({
										filled: existingInputs[inputId] ? 'yes' : 'no',
										period: period,
										formId: form.id, formName: form.name,
										inputEntityId: inputEntity.id,
										inputEntityName: inputEntity.name
									});

								delete existingInputs[inputId];
							});
						});
					});

					Object.keys(existingInputs).forEach(function(inputId) {
						var parts = inputId.split(':');
						displayedInputs.push({
							filled: 'invalid',
							period: moment(parts[3], 'YYYY-MM-DD'),
							formId: parts[2],
							formName: project.dataCollection.find(function(form) { return form.id === parts[2]; }).name,
							inputEntityId: parts[1],
							inputEntityName: parts[1] == 'none' ? undefined : project.inputEntities.find(function(entity) { return entity.id === parts[1]; }).name
						});
					});

					return displayedInputs;
				});
			}
		}
	});

	$stateProvider.state('main.project.input', {
		url: '/input/:period/:formId/:entityId',
		templateUrl: 'partials/projects/input/edit.html',
		controller: 'ProjectInputController',
		resolve: {
			inputs: function(mtFetch, $stateParams) {
				return mtFetch.inputs({
					mode: "current+last",
					projectId: $stateParams.projectId,
					entityId: $stateParams.entityId,
					formId: $stateParams.formId,
					period: $stateParams.period
				}).then(function(result) {
					var currentInputId = [$stateParams.projectId, $stateParams.entityId, $stateParams.formId, $stateParams.period].join(':');

					// both where found
					if (result.length === 2) 
						return { current: result[0], previous: result[1], isNew: false };

					// only the current one was found
					else if (result.length === 1 && result[0]._id === currentInputId) 
						return { current: result[0], previous: null, isNew: false };

					// the current one was not found (and we may or not have found the previous one).
					var previousInput = result.length ? result[0] : null,
					newInput          = mtFetch.input();
					newInput._id      = currentInputId;
					newInput.project  = $stateParams.projectId;
					newInput.form     = $stateParams.formId;
					newInput.period   = new Date($stateParams.period);
					newInput.entity  = $stateParams.entityId;

					return { current: newInput, previous: previousInput, isNew: true };
				});
			},
			form: function($stateParams, project) {
				return project.dataCollection.find(function(form) { return form.id == $stateParams.formId; });
			}
		}
	});

	$stateProvider.state('main.project.reporting', {
		url: '/reporting',
		templateUrl: 'partials/projects/reporting/display.html',
		controller: 'ProjectReportingController'
	});

	$stateProvider.state('main.project.reporting_analysis_list', {
		url: '/reporting-analysis-list',
		templateUrl: 'partials/projects/reporting/analysis-list.html',
		controller: 'ProjectReportingAnalysisListController',
		resolve: {
			reports: function(mtFetch, $stateParams) {
				return mtFetch.reports({mode: "dates_only", projectId: $stateParams.projectId});
			}
		}
	});

	$stateProvider.state('main.project.reporting_analysis', {
		url: '/reporting-analysis/:reportId',
		templateUrl: 'partials/projects/reporting/analysis.html',
		controller: 'ProjectReportingAnalysisController',
		resolve: {
			report: function(mtFetch, $stateParams) {
				var report = mtFetch.report($stateParams.reportId);
				if ($stateParams.reportId === 'new')
					report.project = $stateParams.projectId;
				return report;
			}
		}
	});

	$stateProvider.state('main.project.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/user/list.html',
		controller: 'ProjectUserListController',
		resolve: {
			users: function(mtFetch) {
				return mtFetch.users();
			}
		}
	});

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

			// FIXME! that patch is the uglyest thing, we are wasting tons of bandwidth
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({}, true);
			},
		}
	});


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
		templateUrl: 'partials/help/general/presentation_general.html'
	});

	$stateProvider.state('main.help.offline_access', {
		controller: 'HelpController',
		url: "/offline_access",
		templateUrl: 'partials/help/general/offline_access.html'
	});

	$stateProvider.state('main.help.acls', {
		controller: 'HelpController',
		url: "/acls",
		templateUrl: 'partials/help/general/acls.html'
	});

	$stateProvider.state('main.help.translation', {
		controller: 'HelpController',
		url: "/translation",
		templateUrl: 'partials/help/general/translation.html'
	});

	$stateProvider.state('main.help.presentation_indicator', {
		controller: 'HelpController',
		url: "/presentation_indicator",
		templateUrl: 'partials/help/indicators/presentation_indicator.html'
	});

	$stateProvider.state('main.help.completeness', {
		controller: 'HelpController',
		url: "/completeness",
		templateUrl: 'partials/help/indicators/completeness.html'
	});

	$stateProvider.state('main.help.operation_modes', {
		controller: 'HelpController',
		url: "/operation_modes",
		templateUrl: 'partials/help/indicators/operation_modes.html'
	});

	$stateProvider.state('main.help.computation', {
		controller: 'HelpController',
		url: "/computation",
		templateUrl: 'partials/help/indicators/computation.html'
	});

	$stateProvider.state('main.help.collection_history', {
		controller: 'HelpController',
		url: "/collection_history",
		templateUrl: 'partials/help/indicators/collection_history.html'
	});

	$stateProvider.state('main.help.presentation_project', {
		controller: 'HelpController',
		url: "/presentation_project",
		templateUrl: 'partials/help/project/presentation_project.html'
	});

	$stateProvider.state('main.help.logical_frame', {
		controller: 'HelpController',
		url: "/logical_frame",
		templateUrl: 'partials/help/project/logical_frame.html'
	});

	$stateProvider.state('main.help.entities_groups', {
		controller: 'HelpController',
		url: "/entities_groups",
		templateUrl: 'partials/help/project/entities_groups.html'
	});

	$stateProvider.state('main.help.input_forms', {
		controller: 'HelpController',
		url: "/input_forms",
		templateUrl: 'partials/help/project/input_forms.html'
	});

	$stateProvider.state('main.help.users', {
		controller: 'HelpController',
		url: "/users",
		templateUrl: 'partials/help/project/users.html'
	});

	$stateProvider.state('main.help.inputs', {
		controller: 'HelpController',
		url: "/inputs",
		templateUrl: 'partials/help/project/inputs.html'
	});

	$stateProvider.state('main.help.statistics', {
		controller: 'HelpController',
		url: "/statistics",
		templateUrl: 'partials/help/project/statistics.html'
	});

	$stateProvider.state('main.help.descriptive_analysis', {
		controller: 'HelpController',
		url: "/descriptive_analysis",
		templateUrl: 'partials/help/project/descriptive_analysis.html'
	});

	$stateProvider.state('main.help.change_definition', {
		controller: 'HelpController',
		url: "/change_definition",
		templateUrl: 'partials/help/project/change_definition.html'
	});

});


app.run(function($rootScope, $state, mtFetch) {
	$rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
		console.log(error)
		console.log(error.stack)
	});

	mtFetch.currentUser().then(function(user) {
		$rootScope.userCtx = user;
	}).catch(function(error) {
		$state.go('main.login');
	});
})

angular.element(document).ready(function() {
	angular.bootstrap(document, ['monitool.app']);
});

