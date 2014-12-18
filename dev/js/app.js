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
			indicatorsById: function(mtFetch, project) {
				return mtFetch.indicatorsByProject(project);
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
			indicatorsById: function(mtFetch, project) {
				return mtFetch.indicatorsByProject(project);
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
			indicatorsById: function(mtFetch, project) {
				return mtFetch.indicatorsByProject(project)
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
			inputs: function($stateParams, mtDatabase, project) {
				return mtDatabase.current
					.allDocs({startkey: $stateParams.projectId + ':', endkey: $stateParams.projectId + ':~'})
					.then(function(result) {
						var inputExists = {}, inputs = [];
						result.rows.forEach(function(row) { inputExists[row.id] = true; });
						
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
				return mtFetch.currentPreviousInput($stateParams);
			},
			indicatorsById: function(mtFetch, project) {
				return mtFetch.indicatorsByProject(project);
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
			indicatorsById: function(mtFetch, project) {
				return mtFetch.indicatorsByProject(project);
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
			},
			indicatorsById: function($q, mtFetch, projects) {
				var promises = projects.map(function(p) { return mtFetch.indicatorsByProject(p); });
				return $q.all(promises).then(function(result) {
					var r = {};
					result.forEach(function(indicatorsById) {
						for (var indicatorId in indicatorsById)
							r[indicatorId] = indicatorsById[indicatorId];
					});
					return r;
				});
			}
		}
	});


});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['monitool.app']);
});





