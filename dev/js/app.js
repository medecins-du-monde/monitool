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
	'monitool.services.database',
	'monitool.services.fetch',
	'monitool.services.reporting',
	'ngCookies',
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
		templateUrl: 'partials/menu.html',
		resolve: {
			session: function($state, mtDatabase) {
				// check that user is logged in
				return mtDatabase.remote.getSession().then(function(response) {
					if (!response.userCtx || !response.userCtx.name)
						return null;

					return response;
				}).catch(function(error) {
					return null;
				});
			}
		}
	});

	$stateProvider.state('main.login', {
		controller: 'LoginController',
		url: '/login',
		templateUrl: 'partials/login.html'
	});

	$stateProvider.state('main.change_password', {
		controller: 'ChangePasswordController',
		url: '/change-password',
		templateUrl: 'partials/change-password.html'
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
					return mtDatabase.current.query('shortlists/indicators_short', {keys: ids}).then(function(result) {
						var indicatorsById = {};
						result.rows.forEach(function(row) { indicatorsById[row.key] = row.value; });
						return indicatorsById;
					});
				else
					return {};
			}
		}
	});

	$stateProvider.state('main.project.logical_frame.indicator_edit', {
		url: '/indicator/:indicatorId/:target',
		onEnter: function($state, $stateParams, $modal, project, session) {
			$modal.open({
				templateUrl: 'partials/projects/logical-frame-indicator.html',
				controller: 'ProjectLogicalFrameIndicatorController',
				size: 'lg',
				resolve: {
					project: function() { return project; },
					userCtx: function() { return session.userCtx; },
					indicatorId: function() { return $stateParams.indicatorId; },
					target: function() { return $stateParams.target; }
				}
			}).result.then(function() {
				$state.go('main.project.logical_frame');
			});
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
		controller: 'ProjectReportingController',
		resolve: {
			type: function() { return 'entity'; },
			indicatorsById: function(mtDatabase, project) {
				var indicatorsById = {};
				mtDatabase.current.allDocs({keys: Object.keys(project.indicators), include_docs: true}).then(function(result) {
					result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });
				});
				return indicatorsById;
			}
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
		controller: 'ProjectReportingController',
		resolve: {
			type: function() { return 'group'; },
			indicatorsById: function(mtDatabase, project) {
				var indicatorsById = {};
				mtDatabase.current.allDocs({keys: Object.keys(project.indicators), include_docs: true}).then(function(result) {
					result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });
				});
				return indicatorsById;
			}
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
			indicatorsById: function($stateParams, mtDatabase, project) {
				var indicatorsById = {};
				Object.keys(project.indicators).forEach(function(id) { indicatorsById[id] = true; });

				if ($stateParams.formId !== 'new') {
					var form = 	project.dataCollection.filter(function(form) { return form.id == $stateParams.formId; })[0];
					Object.keys(form.fields).forEach(function(id) { indicatorsById[id] = true; });
				}

				mtDatabase.current.allDocs({include_docs: true, keys: Object.keys(indicatorsById)}).then(function(result) {
					result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });
				});

				return indicatorsById;
			}
		}
	});

	$stateProvider.state('main.project.input_list', {
		url: '/inputs',
		templateUrl: 'partials/projects/input-list.html',
		controller: 'ProjectInputListController',
		resolve: {
			inputs: function($stateParams, mtDatabase, project) {
				return mtDatabase.current
					.allDocs({startkey: $stateParams.projectId + ':', endkey: $stateParams.projectId + ':~'})
					.then(function(result) {
						var inputExists = {}, inputs = [];
						result.rows.forEach(function(row) { inputExists[row.id] = true; });
						
						project.inputEntities.forEach(function(inputEntity) {
							project.dataCollection.forEach(function(form) {
								var periods;
								if (form.periodicity == 'monthly' || form.periodicity == 'quarterly') {
									var current = moment(form.useProjectStart ? project.begin : form.begin, 'YYYY-MM'),
										end     = moment(form.useProjectEnd ? project.end : project.end, 'YYYY-MM');

									if (end.isAfter()) // do not allow to go in the future
										end = moment();

									periods = [];
									while (current.isBefore(end)) {
										periods.push(current.clone());
										current.add(form.periodicity === 'monthly' ? 1 : 3, 'month');
									}
								}
								else if (form.periodicity === 'planned') {
									periods = form.periods;
								}
								else
									throw new Error(form.periodicity + ' is not a valid periodicity');

								periods.forEach(function(period) {
									inputs.push({
										filled: inputExists[[project._id, inputEntity.id, form.id, period.format('YYYY-MM')].join(':')],
										period: period,
										formId: form.id, formName: form.name,
										inputEntityId: inputEntity.id, inputEntityName: inputEntity.name
									});
								});
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
			inputs: function(mtFetch, $stateParams) { return mtFetch.currentPreviousInput($stateParams); }
		}
	});

	$stateProvider.state('main.project.reporting', {
		url: '/reporting',
		templateUrl: 'partials/projects/reporting.html',
		controller: 'ProjectReportingController',
		resolve: {
			type: function() { return 'project'; },
			indicatorsById: function(mtDatabase, project) {
				var indicatorsById = {};
				mtDatabase.current.allDocs({keys: Object.keys(project.indicators), include_docs: true}).then(function(result) {
					result.rows.forEach(function(row) { indicatorsById[row.id] = row.doc; });
				});
				return indicatorsById;
			}
		},

	});

	$stateProvider.state('main.project.user_list', {
		url: '/users',
		templateUrl: 'partials/projects/user-list.html',
		controller: 'ProjectUserListController',
		resolve: {
			users: function(mtDatabase) {
				return mtDatabase.user.allDocs().then(function(data) {
					data.rows.shift();
					return data.rows.map(function(row) {
						return row.id.substring("org.couchdb.user:".length);
					});
				});
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
		resolve: {
			typesById: function(mtFetch) { return mtFetch.typesById(); },
			themesById: function(mtFetch) { return mtFetch.themesById(); }
		}
	});

	$stateProvider.state('main.indicators.theme_list', {
		url: '/themes',
		templateUrl: 'partials/indicators/theme-type-list.html',
		controller: 'ThemeTypeListController',
		resolve: {
			entities: function(mtFetch) { return mtFetch.themes(); }
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
			entities: function(mtFetch) { return mtFetch.types(); }
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
			indicatorsById: function(mtDatabase, indicator) {
				var ids = {};
				for (var i in indicator.formulas)
					for (var j in indicator.formulas[i].parameters)
						ids[indicator.formulas[i].parameters[j]] = true;
				return mtDatabase.current.allDocs({keys: Object.keys(ids), include_docs: true}).then(function(result) {
					var r = {};
					result.rows.forEach(function(row) { r[row.key] = row.doc; });
					return r;
				});
			},
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





