"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	return {
		current: new PouchDB(REMOTE_DB, {adapter: 'http', ajax: {cache: true}}),
	};

	return {
		local: new PouchDB(LOCAL_DB),
		remote: new PouchDB(REMOTE_DB, {adapter: 'http', ajax: {cache: true}}),
	};
});

mtServices.factory('mtStatus', function($q, mtDatabase) {

	var fsm = StateMachine.create({
		initial: "Init",
		states: [
			"Init",

			"OfflineFail",
			"OnlineOnly",
			"InitialSync",
			"Synced",

			"ProjectDownload",
			"Offline",
			"Resync",
			"Conflicted"
		],
		events: [
			{ name: "initFail", from: "Init", to: "OfflineFail"},
			{ name: "initOffline", from: "Init", to: "Offline"},
			{ name: "initOnline", from: "Init", to: "OnlineOnly"},
			{ name: "initResync", from: "Init", to: "Resync"},

			{ name: "dirtyConnect", from: "OfflineFail", to: "OnlineOnly" },
			{ name: "enableOffline", from: "OnlineOnly", to: "InitialSync" },
			{ name: "dirtyDisconnect", from: ["InitialSync", "OnlineOnly"], to: "OfflineFail" },

			{ name: "initialSyncDone", from: "InitialSync", to: "Synced" },
			{ name: "addProject", from: "Synced", to: "ProjectDownload" },
			{ name: "addProjectDone", from: "ProjectDownload", to: "Synced" },
			{ name: "cleanDisconnect", from: ["Synced", "ProjectDownload"], to: "Offline"},

			{ name: "cleanConnect", from: "Offline", to: "Resync"},
			{ name: "resyncDone", from: "Resync", to: "Synced"},
			{ name: "resyncConflict", from: "Resync", to: "Conflicted"},
			{ name: "conflictResolve", from: "Conflicted", to: "Synced"},
		],
		callbacks: {
			onenterOfflineFail: function() {
				// // check every second if we can connect
				// var checkConnectivity = function() {
				// 	return mtDatabase.remote.info()
				// 		.then(function(info) {
				// 			fsm.dirtyConnect();
				// 		})
				// 		.catch(function(error) {
				// 			setTimeout(checkConnectivity, 1000);
				// 			return false;
				// 		});
				// };

				// checkConnectivity();
			},

			onenterOnlineOnly: function() {
				mtDatabase.current = mtDatabase.remote;
				// start up application!!
			},

			onenterInitialSync: function() {
				mtDatabase.local.put({_id: '_local/projects', projects: []}).then(function() {
					var replication = PouchDB.replicate(REMOTE_DB, LOCAL_DB, {filter: "monitool/offline"})
						// destroy local database and disconnect if the replication fails.
						// we could try to resume as it should work but well...
						.on('error', function() {
							PouchDB.destroy(LOCAL_DB);
							mtDatabase.local = new PouchDB(LOCAL_DB);
							fsm.dirtyDisconnect();
							console.log('fail')
						})

						// if the replication worked, we are done
						.on('complete', function() {
							mtDatabase.local.put({_id: '_local/status'}).then(function() {
								fsm.initialSyncDone();
							});
						});
				})
			},

			onenterSynced: function() {
				mtDatabase.local.get('_local/projects').then(function(projectIds) {
					var repOptions = {live: true, filter: "monitool/offline", queryParams: {projects: projectIds}};

					PouchDB.replicate(REMOTE_DB, LOCAL_DB, repOptions)
						// when there is a replication error, assume that we have disconnected
						.on('error', function(error) {
							fsm.cleanDisconnect();
							mtDatabase.current = mtDatabase.local;
						});
				});
			},

			onenterProjectDownload: function() {

			},

			onenterOffline: function() {
				mtDatabase.current = mtDatabase.local;
			},

			onenterResync: function() {

			},

			onenterConflicted: function() {

			},

		}
	});

	return fsm;
});


mtServices.factory('mtFetch', function($route, $q, mtDatabase) {
	var reformatArray = function(result) {
		return result.rows.map(function(row) {
			row.value._id = row.key;
			return row.value;
		});
	};

	var reformatHashById = function(result) {
		var types = {};
		result.rows.forEach(function(row) { return types[row.key] = row.value; });
		return types;
	};

	var handleError = function(error) {
		console.log(error)
	}

	return {
		currentProject: function() {
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
				return mtDatabase.current.get($route.current.params.projectId);
		},
		projects: function() {
			return mtDatabase.current.query('monitool/projects_short').then(reformatArray).catch(handleError);
		},
		projectsByIndicator: function(indicatorId) {
			return mtDatabase.current.query('monitool/projects_by_indicator', {key: indicatorId, include_docs: true}).then(function(result) {
				return result.rows.map(function(row) { return row.doc; });
			});
		},

		currentIndicator: function() {
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
				return mtDatabase.current.get($route.current.params.indicatorId);
		},
		indicators: function() {
			return mtDatabase.current.query('monitool/indicators_short', {group: true}).then(reformatArray);
		},		
		indicatorHierarchy: function(forbiddenIds) {
			return mtDatabase.current.query('monitool/indicators_short', {group: true}).then(function(result) {
				var hierarchy = {};

				result.rows.forEach(function(row) {
					// skip forbidden indicators if parameter was provided (for logical frame edition, and avoiding double indicators)
					if (forbiddenIds && forbiddenIds.indexOf(row.key) !== -1)
						return;

					// add dummy types and themes
					!row.value.themes.length && row.value.themes.push('');
					!row.value.types.length  && row.value.types.push('');

					row.value.themes.forEach(function(theme) {
						row.value.types.forEach(function(type) {
							// add empty tree branches if those are undefined
							!hierarchy[theme] && (hierarchy[theme] = {});
							!hierarchy[theme][type] && (hierarchy[theme][type] = []);

							row.value._id = row.key;
							hierarchy[theme][type].push(row.value);
						});
					});
				});

				return hierarchy;
			});
		},
		themes: function() {
			return mtDatabase.current.query('monitool/themes_short', {group: true}).then(reformatArray);
		},
		themesById: function() {
			return mtDatabase.current.query('monitool/themes_short', {group: true}).then(reformatHashById);
		},
		types: function() {
			return mtDatabase.current.query('monitool/types_short', {group: true}).then(reformatArray);
		},
		typesById: function() {
			return mtDatabase.current.query('monitool/types_short', {group: true}).then(reformatHashById);
		},
	};
});

mtServices.factory('mtIndicators', function($q, mtDatabase) {

	var evaluateAll = function(project, regrouped) {
		var evaluateScope = function(form, scope) {
			var values = null, newValues = angular.copy(scope);

			while (!angular.equals(values, newValues)) {
				for (var indicatorId in form.fields) {
					var field = form.fields[indicatorId];

					if (field && field.type === 'computed') {
						var localScope = {};
						for (var paramName in field.parameters)
							localScope[paramName] = scope[field.parameters[paramName]] || 0;
						scope[indicatorId] = math.eval(field.expression, localScope);
					}
				}
				values    = newValues;
				newValues = scope;
			}
		};

		// compute indicators
		var fakeForm = {fields:{}}; // wrong!
		project.dataCollection.forEach(function(form) {
			for (var key in form.fields)
				fakeForm.fields[key] = form.fields[key];
		});
		for (var key in regrouped)
			evaluateScope(fakeForm, regrouped[key]);
	};

	var regroup = function(rows, makeKeys) {
		var result = {};

		rows.forEach(function(row) {
			makeKeys(row.key).forEach(function(key) {
				if (!result[key])
					result[key] = angular.copy(row.value);
				else
					for (var indicatorId in row.value) {
						if (result[key][indicatorId])
							result[key][indicatorId] += row.value[indicatorId];
						else
							result[key][indicatorId] = row.value[indicatorId];
					}
			});
		});

		return result;
	};

	var getStatsColumns = function(project, begin, end, groupBy, type, id) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		if (groupBy === 'month' || groupBy === 'year') {
			var format  = groupBy === 'month' ? 'YYYY-MM' : 'YYYY',
				current = begin.clone(),
				cols    = [];

			while (current.isBefore(end) || current.isSame(end)) {
				cols.push({id: current.format(format), name: current.format(format)});
				current.add(1, groupBy);
			}
			cols.push({id: 'total', name: 'Total'});
			return cols;
		}
		else if (groupBy === 'entity') {
			if (type === 'project')
				return project.inputEntities.concat([{id:'total',name:'Total'}]);
			else if (type === 'entity')
				return project.inputEntities.filter(function(e) { return e.id === id })
											.concat([{id:'total',name:'Total'}]);
			else  if (type === 'group') {
				var groups = project.inputGroups.filter(function(g) { return g.id === id });
				return project.inputEntities.filter(function(e) { return groups[0].members.indexOf(e.id) !== -1 })
											.concat([{id:'total',name:'Total'}]);
			}
		}
		else if (groupBy === 'group') {
			if (type === 'project')
				return project.inputGroups;
			else if (type === 'entity')
				return project.inputGroups.filter(function(g) { return g.members.indexOf(id) !== -1 });
			else if (type === 'group')
				return project.inputGroups.filter(function(g) { return g.id === id });
		}
		else
			throw new Error('Invalid groupBy: ' + groupBy)
	};

	// @FIXME Should be a dichotomy, and targets should be sorted all the time (before saving).
	var getTargetValue = function(period, planning) {
		console.log(planning)
		var targets = planning.targets, numTargets = targets.length;
		if (numTargets == 0)
			return 0;
		
		targets.sort(function(a, b) { return a.period.localeCompare(b.period); });
		var index = 0;
		while (index < numTargets) {
			if (targets[index].period > period)
				return targets[index].value;
			++index;
		}

		return targets[numTargets - 1].value;
	};

	var retrieveMetadata = function(project, regrouped, begin, groupBy) {
		// add metadata
		var regroupedWithMetadata = {};
		for (var key in regrouped) {
			regroupedWithMetadata[key] = {};

			for (var indicatorId in regrouped[key]) {
				var params   = project.indicators[indicatorId],
					metadata = {value: Math.round(regrouped[key][indicatorId])};

				// compute display value
				if (params) {
					var targetValue = getTargetValue(groupBy === 'month' ? key : begin.format('YYYY-MM'), params);

					metadata.baselinePart = Math.round(100 * metadata.value / params.baseline);
					metadata.targetPart = Math.round(100 * metadata.value / targetValue);

					// compute color
					if (params.greenMinimum <= metadata.value && metadata.value <= params.greenMaximum)
						metadata.color = '#AFA';
					else if (params.orangeMinimum <= metadata.value && metadata.value <= params.orangeMaximum)
						metadata.color = '#FC6';
					else
						metadata.color = '#F88';
				}

				regroupedWithMetadata[key][indicatorId] = metadata;
			}
		}

		return regroupedWithMetadata;
	};

	var getProjectStats = function(project, begin, end, groupBy) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		var options = {
			startkey: [project._id, begin.format('YYYY'), begin.format('MM')],
			endkey: [project._id, end.format('YYYY'), end.format('MM'), {}],
			group_level: {year: 2, month: 3, entity: 4, group: 4}[groupBy]
		};

		return mtDatabase.current.query('monitool/inputs_by_project_year_month_entity', options).then(function(result) {
			var keyTransformFunctions = {
				month:  function(key) { return ['total', key[1] + '-' + key[2]]; }, // 2014-05
				year:   function(key) { return ['total', key[1]]; }, // 2014
				entity: function(key) { return ['total', key[3]]; }, // key index 3: "entity"
				group:  function(key) {
					return project.inputGroups.filter(function(group) {
						return group.members.indexOf(key[3]) !== -1;
					}).map(function(group) { return group.id; });
				}
			};

			// Regroup and evaluate
			var regrouped = regroup(result.rows, keyTransformFunctions[groupBy]);
			evaluateAll(project, regrouped);
			return retrieveMetadata(project, regrouped, begin, groupBy);
		});
	};

	var getEntityStats = function(project, begin, end, groupBy, entityId) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		var options = {
			startkey:    [entityId, begin.format('YYYY'), begin.format('MM')],
			endkey:      [entityId, end.format('YYYY'), end.format('MM')],
			group_level: {year: 2, month: 3, entity: 0, group: 0}[groupBy],
		};

		return mtDatabase.current.query('monitool/inputs_by_entity_year_month', options).then(function(result) {
			var keyTransformFunctions = {
				month:  function(key) { return ['total', key[1] + '-' + key[2]]; },
				year:   function(key) { return ['total', key[1]]; },
				entity: function(key) { return ['total', entityId]; },

				// Keep groups that contains entityId
				group:  function(key) {
					return project.inputGroups.filter(function(group) {
						return group.members.indexOf(entityId) !== -1;
					}).map(function(group) { return group.id; });
				},
			};

			// Regroup and evaluate
			var regrouped = regroup(result.rows, keyTransformFunctions[groupBy]);
			evaluateAll(project, regrouped);
			return retrieveMetadata(project, regrouped, begin, groupBy);
		});
	};

	var getGroupStats = function(project, begin, end, groupBy, entityGroupId) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		// We need all four levels on the project_year_month_entity view :(
		// we can't filter by group at query level because those are not in the input documents (as they change after input).
		var options = {
			startkey: [project._id, begin.format('YYYY'), begin.format('MM')],
			endkey: [project._id, end.format('YYYY'), end.format('MM'), {}],
			group_level: 4
		};

		return mtDatabase.current.query('monitool/inputs_by_project_year_month_entity', options).then(function(result) {
			// Declare couchdb key transformation functions.
			var keyTransformFunctions = {
				month:  function(key) { return ['total', key[1] + '-' + key[2]]; }, // 2014-05
				year:   function(key) { return ['total', key[1]]; }, // 2014
				entity: function(key) { return ['total', key[3]]; }, // key index 3: "entity"
				group:  function(key) { return ['total', entityGroupId]; },
			};

			// Retrieve the inputGroup members and filter our result.
			var members = project.inputGroups.filter(function(g) { return g.id === entityGroupId; })[0].members;
			result.rows = result.rows.filter(function(row) { return members.indexOf(row.key[3]) !== -1; });

			// Regroup and evaluate
			var regrouped = regroup(result.rows, keyTransformFunctions[groupBy]);
			evaluateAll(project, regrouped);
			return retrieveMetadata(project, regrouped, begin, groupBy);
		});
	};

	var getIndicatorStats = function(indicator, projects, begin, end, groupBy) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		var queries = projects.map(function(project) {
			return mtDatabase.current.query('monitool/inputs_by_project_year_month_entity', {
				startkey: [project._id, begin.format('YYYY'), begin.format('MM')],
				endkey: [project._id, end.format('YYYY'), end.format('MM'), {}],
				group: true // we need centers...
			});
		});

		return $q.all(queries).then(function(results) {
			var regrouped = {};

			results.map(function(result, index) {
				// regroup, and add metadata for each project stats (they all use different settings)
				// this use JSON compound keys to keep time and project/entity
				var pRegrouped = regroup(result.rows, function(key) {
					var period  = groupBy === 'month' ? key[1] + '-' + key[2] : key[1],
						project = key[0],
						center  = key[3],
						keys    = [[period, center], [period, project], ['total', center], ['total', project]];

					return keys.map(JSON.stringify);
				});

				evaluateAll(projects[index], pRegrouped);
				return retrieveMetadata(projects[index], pRegrouped, begin, groupBy);
			}).forEach(function(pRegrouped) {
				// Nest the JSON.keys into a 2 level hash.
				for (var compoundKey in pRegrouped) {
					var key = JSON.parse(compoundKey);
					if (!regrouped[key[0]])
						regrouped[key[0]] = {};
					regrouped[key[0]][key[1]] = pRegrouped[compoundKey];
				}
			});
			return regrouped;
		});
	};

	return {
		getStatsColumns:   getStatsColumns,
		getProjectStats:   getProjectStats,
		getGroupStats:     getGroupStats,
		getEntityStats:    getEntityStats,
		getIndicatorStats: getIndicatorStats
	};
});
