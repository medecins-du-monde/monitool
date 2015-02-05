"use strict";

var app = angular.module('monitool.app', [
	'angularMoment',
	'monitool.controllers.helper',
	'monitool.controllers.indicator',
	'monitool.controllers.project',
	'monitool.directives.acl',
	'monitool.directives.form',
	'monitool.directives.fileexport',
	'monitool.directives.indicatorselect',
	'monitool.filters',
	'monitool.services.fetch',
	'monitool.services.reporting',
	'ngCookies',
	'ngResource',
	'pascalprecht.translate',
	'ui.bootstrap',
	'ui.bootstrap.showErrors',
	'ui.router',
	'ui.select',
]);

app.config(function($translateProvider) {
	$translateProvider.translations('fr', FRENCH_TRANSLATION);
	$translateProvider.translations('en', ENGLISH_TRANSLATION);
	$translateProvider.translations('es', SPANISH_TRANSLATION);

	$translateProvider.useLocalStorage();
	$translateProvider.preferredLanguage('fr');
});

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
 * Transform all dates that come from the server to date objects, and back
 * Remove all properties prefixed by "__" when submitting to server
 * (which allow us to add helper properties on objects, and not submit them).
 */
app.config(function($httpProvider) {
	// $httpProvider.defaults.headers.common['X-NoBasicAuth'] = '1';
	// if (sessionStorage.Authorization)
	// 	$httpProvider.defaults.headers.common.Authorization = sessionStorage.Authorization;

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
				for (var key in model)
					// remove virtual properties
					if (key.substring(0, 2) === '__')
						delete model[key];
					else
						model[key] = stringifyDates(model[key]);
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

	// $stateProvider.state('main.login', {
	// 	controller: 'LoginController',
	// 	url: '/login',
	// 	templateUrl: 'partials/login.html'
	// });

	// $stateProvider.state('main.change_password', {
	// 	controller: 'ChangePasswordController',
	// 	url: '/change-password',
	// 	templateUrl: 'partials/change-password.html'
	// });

	///////////////////////////
	// Help
	///////////////////////////

	// $stateProvider.state('main.help', {
	// 	abstract: true,
	// 	templateUrl: 'partials/help/menu.html'
	// });

	// $stateProvider.state('main.help.monitoring', {
	// 	url: '/help/monitoring',
	// 	templateUrl: 'partials/help/monitoring.html'
	// });

	// $stateProvider.state('main.help.documentation', {
	// 	url: '/help/documentation',
	// 	templateUrl: 'partials/help/documentation.html'
	// });

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
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: 'project_logframe', projectId: $stateParams.projectId}, true);
			}
		}
	});

	$stateProvider.state('main.project.input_entities', {
		url: '/input-entities',
		templateUrl: 'partials/projects/input-entities.html',
		controller: 'ProjectInputEntitiesController'
	});

	$stateProvider.state('main.project.input_entities_reporting', {
		url: '/input-entities/:id',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ProjectReportingController',
		resolve: {
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "project_reporting", projectId: $stateParams.projectId}, true);
			}
		},
		data: {
			type: 'entity',
		}

	});

	$stateProvider.state('main.project.input_groups', {
		url: '/input-groups',
		templateUrl: 'partials/projects/input-groups.html',
		controller: 'ProjectInputGroupsController'
	});

	$stateProvider.state('main.project.input_groups_reporting', {
		url: '/input-groups/:id',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ProjectReportingController',
		resolve: {
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "project_reporting", projectId: $stateParams.projectId}, true);
			}
		},
		data: {
			type: 'group',
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
		controller: 'ProjectFormEditionController',
		resolve: {
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "project_reporting", projectId: $stateParams.projectId}, true);
			},
			formulasById: function(indicatorsById) {
				var formulasById = {};
				for (var indicatorId in indicatorsById)
					for (var formulaId in indicatorsById[indicatorId].formulas)
						formulasById[formulaId] = indicatorsById[indicatorId].formulas[formulaId];

				return formulasById;
			},
			form: function($stateParams, project) {
				if ($stateParams.formId === 'new')
					return {
						id: PouchDB.utils.uuid().toLowerCase(), name: "",
						periodicity: "month", 
						useProjectStart: true, useProjectEnd: true, start: project.begin, end: project.end, intermediaryDates: [], active: true,
						fields: []
					};
				else
					return project.dataCollection.find(function(form) { return form.id == $stateParams.formId; });
			}
		}
	});

	$stateProvider.state('main.project.input_list', {
		url: '/inputs',
		templateUrl: 'partials/projects/input-list.html',
		controller: 'ProjectInputListController',
		resolve: {
			inputs: function($stateParams, mtFetch, project) {

				return mtFetch.inputs({mode: 'project_input_ids', projectId: project._id}).then(function(result) {
					var inputExists = {}, inputs = [];
					result.forEach(function(id) { inputExists[id] = true; });
					
					project.inputEntities.forEach(function(inputEntity) {
						project.dataCollection.forEach(function(form) {
							var periods;
							if (['year', 'quarter', 'month', 'week', 'day'].indexOf(form.periodicity) !== -1) {
								var period = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

								var current = moment(form.useProjectStart ? project.begin : form.begin).startOf(period),
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

							periods.forEach(function(period) {
								var inputId = [project._id, inputEntity.id, form.id, period.format('YYYY-MM-DD')].join(':');
								if (form.active || inputExists[inputId])
									inputs.push({
										filled: inputExists[inputId] ? 'yes' : 'no',
										period: period,
										formId: form.id, formName: form.name,
										inputEntityId: inputEntity.id,
										inputEntityName: inputEntity.name
									});

								delete inputExists[inputId];
							});
						});
					});
					
					Object.keys(inputExists).forEach(function(inputId) {
						var parts = inputId.split(':');
						inputs.push({
							filled: 'invalid',
							period: moment(parts[3], 'YYYY-MM-DD'),
							formId: parts[2],
							formName: project.dataCollection.find(function(form) { return form.id === parts[2]; }).name,
							inputEntityId: parts[1],
							inputEntityName: project.inputEntities.find(function(entity) { return entity.id === parts[1]; }).name
						});
					});

					inputs.sort(function(a, b) {
						if (a.period.isSame(b.period)) {
							var nameCmp = a.inputEntityName.localeCompare(b.inputEntityName);
							return nameCmp !== 0 ? nameCmp : a.formName.localeCompare(b.formName);
						}
						else
							return a.period.isBefore(b.period) ? -1 : 1;
					});

					return inputs;
				});
			}
		}
	});

	$stateProvider.state('main.project.input', {
		url: '/input/:period/:formId/:entityId',
		templateUrl: 'partials/projects/input.html',
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
						newInput      = mtFetch.input();

					newInput._id     = currentInputId;
					newInput.project = $stateParams.projectId;
					newInput.entity  = $stateParams.entityId;
					newInput.form    = $stateParams.formId;
					newInput.period  = new Date($stateParams.period);
					return { current: newInput, previous: previousInput, isNew: true };
				});
			},
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "project_reporting", projectId: $stateParams.projectId}, true);
			},
			form: function($stateParams, project) {
				return project.dataCollection.find(function(form) { return form.id == $stateParams.formId; });
			}
		}
	});

	$stateProvider.state('main.project.reporting', {
		url: '/reporting',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ProjectReportingController',
		resolve: {
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "project_reporting", projectId: $stateParams.projectId}, true);
			}
		},
		data: {
			type: 'project',
		}
	});

	$stateProvider.state('main.project.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/user-list.html',
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
		abstract: true,
		templateUrl: 'partials/indicators/menu.html'
	});
	
	$stateProvider.state('main.indicators.list', {
		url: '/indicators',
		templateUrl: 'partials/indicators/list.html',
		controller: 'IndicatorListController',
	});
	
	$stateProvider.state('main.indicators.theme_list', {
		url: '/themes',
		templateUrl: 'partials/indicators/theme-type-list.html',
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

	$stateProvider.state('main.indicators.type_list', {
		url: '/types',
		templateUrl: 'partials/indicators/theme-type-list.html',
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
	// Indicator
	///////////////////////////

	$stateProvider.state('main.indicator', {
		abstract: true,
		url: '/indicator/:indicatorId',
		template: '<div ui-view></div>',
		resolve: {
			indicatorsById: function(mtFetch, $stateParams) {
				return mtFetch.indicators({mode: "indicator_edition", indicatorId: $stateParams.indicatorId}, true);
			},
			indicator: function(mtFetch, $stateParams, indicatorsById) {
				return indicatorsById[$stateParams.indicatorId] || mtFetch.indicator();
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
			}
		}
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
