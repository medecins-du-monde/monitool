"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']),
	LOCAL_DB   = 'monitool2',
	REMOTE_DB  = 'http://localhost:5984/monitool';

mtServices.factory('mtDatabase', function(PouchDB) {
	return {
		local: new PouchDB(LOCAL_DB),
		remote: new PouchDB(REMOTE_DB, {adapter: 'http', ajax: {cache: true}})
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


mtServices.factory('mtFetch', function(mtDatabase) {
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
		
		projects: function() {
			return mtDatabase.current.query('monitool/projects_short').then(reformatArray).catch(handleError);
		},
		projectsByIndicator: function(indicatorId) {
			return mtDatabase.current.query('monitool/projects_by_indicator', {key: indicatorId, include_docs: true}).then(function(result) {
				return result.rows.map(function(row) { return row.doc; });
			});
		},
		indicators: function() {
			return mtDatabase.current.query('monitool/indicators_short', {group: true}).then(reformatArray);
		},
		themes: function() {
			return mtDatabase.current.query('monitool/themes_short', {group: true}).then(reformatArray);
		},
		types: function() {
			return mtDatabase.current.query('monitool/types_short', {group: true}).then(reformatArray);
		},
		typesById: function() {
			return mtDatabase.current.query('monitool/types_short', {group: true}).then(reformatHashById);
		},
		themesById: function() {
			return mtDatabase.current.query('monitool/themes_short', {group: true}).then(reformatHashById);
		},
	};
});

mtServices.factory('mtIndicators', function($q, mtDatabase) {

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

	var reduce = function(values) {
		var memo = {}, numValues = values.length;
		for (var i = 0; i < numValues; ++i) {
			var value = values[i];
			for (var key in value)
				if (memo[key])
					memo[key] += value[key];
				else
					memo[key] = value[key];
		}
		return memo;
	};

	var group = function(rows, level) {
		var newResult = {};

		// group them
		rows.forEach(function(row) {
			var newKey = row.key.slice(0, level),
				tmpKey = newKey.join('@');

			if (!newResult[tmpKey])
				newResult[tmpKey] = {key: newKey, values: []};

			newResult[tmpKey].values.push(row.value);
		});

		// reduce them
		return Object.keys(newResult).map(function(tmpKey) {
			return {
				key: newResult[tmpKey].key,
				value: reduce(newResult[tmpKey].values)
			};
		});
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

	var computeTotal = function(regrouped) {
		// compute total
		var total = {};
		for (var key in regrouped)
			for (var indicatorId in regrouped[key])
				if (total[indicatorId])
					total[indicatorId] += regrouped[key][indicatorId];
				else
					total[indicatorId] = regrouped[key][indicatorId];

		return total;
	};

	var processGroups = function(project, regrouped) {
		var regrouped2 = {};

		project.inputGroups.forEach(function(inputGroup) {
			regrouped2[inputGroup.id] = reduce(inputGroup.members.map(function(entityId) {
				return regrouped[entityId] || {};
			}));
		});

		return regrouped2;
	};

	var evaluateAll = function(project, regrouped) {
		// compute indicators
		var fakeForm = {fields:{}}; // wrong!
		project.dataCollection.forEach(function(form) {
			for (var key in form.fields)
				fakeForm.fields[key] = form.fields[key];
		});
		for (var key in regrouped)
			evaluateScope(fakeForm, regrouped[key]);
	};

	var getTargetValue = function(period, targets) {
		return NaN;
	};

	var retrieveMetadata = function(project, begin, end, groupBy, regrouped) {
		// add metadata
		var regroupedWithMetadata = {};
		for (var key in regrouped) {
			regroupedWithMetadata[key] = {};

			for (var indicatorId in regrouped[key]) {
				var params   = project.indicators[indicatorId],
					metadata = {value: regrouped[key][indicatorId]};

				// compute display value
				metadata.display = Math.round(metadata.value);

				if (params) {
					metadata.baselinePart = Math.round(100 * metadata.value / params.baseline) + '%';
					metadata.targetPart = Math.round(100 * metadata.value / getTargetValue());

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

		var view    = 'monitool/inputs_by_project_year_month_entity',
			options = {
				startkey: [project._id, begin.format('YYYY'), begin.format('MM')],
				endkey: [project._id, end.format('YYYY'), end.format('MM'), {}]};

		if (groupBy === 'year')
			options.group_level = 2;
		else if (groupBy === 'month')
			options.group_level = 3;
		else if (groupBy === 'entity' || groupBy === 'group')
			options.group_level = 4;

		return mtDatabase.current.query(view, options).then(function(result) {
			// regroup db results if needed
			var regrouped = {};
			if (groupBy === 'entity' || groupBy === 'group') {
				result.rows.forEach(function(row) { row.key[1] = row.key[3]; });
				result.rows = group(result.rows, 2);
			}
			else if (groupBy === 'month')
				result.rows.forEach(function(row) { row.key[1] += '-' + row.key[2]; });

			result.rows.forEach(function(row) { regrouped[row.key[1]] = row.value; });

			// process groups
			if (groupBy === 'group')
				regrouped = processGroups(project, regrouped);
			else
				regrouped.total = computeTotal(regrouped);
			evaluateAll(project, regrouped);

			return retrieveMetadata(project, begin, end, groupBy, regrouped);
		});
	};

	var getEntityStats = function(project, begin, end, groupBy, entityId) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		var view    = 'monitool/inputs_by_entity_year_month',
			options = {
				startkey: [entityId, begin.format('YYYY'), begin.format('MM')],
				endkey: [entityId, end.format('YYYY'), end.format('MM')]
			};

		if (groupBy === 'year')
			options.group_level = 2;
		else if (groupBy === 'month')
			options.group_level = 3;
		else if (groupBy === 'entity' || groupBy === 'group')
			options.group_level = 0;

		return mtDatabase.current.query(view, options).then(function(result) {
			var regrouped = {};
			if (groupBy === 'year')
				result.rows.forEach(function(row) { regrouped[row.key[1]] = row.value; });
			else if (groupBy === 'month')
				result.rows.forEach(function(row) { regrouped[row.key[1] + '-' + row.key[2]] = row.value; });
			else if (groupBy === 'entity')
				regrouped[entityId] = result.rows[0].value;
			else if (groupBy === 'group')
				project.inputGroups.forEach(function(g) {
					if (g.members.indexOf(entityId) !== -1)
						regrouped[g.id] = result.rows[0].value;
				});

			if (groupBy !== 'group')
				regrouped.total = computeTotal(regrouped);

			evaluateAll(project, regrouped);

			return retrieveMetadata(project, begin, end, groupBy, regrouped);
		});
	};

	var getGroupStats = function(project, begin, end, groupBy, entityGroupId) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		var view    = 'monitool/inputs_by_project_year_month_entity',
			options = {
				startkey: [project._id, begin.format('YYYY'), begin.format('MM')],
				endkey: [project._id, end.format('YYYY'), end.format('MM'), {}],
				group_level: 4
			};

		return mtDatabase.current.query(view, options).then(function(result) {
			var regrouped = {};
			var curGroup = project.inputGroups.filter(function(g) { return g.id === entityGroupId; })[0];

			// filter rows
			result.rows = result.rows.filter(function(row) {
				return curGroup.members.indexOf(row.key[3]) !== -1;
			});

			if (groupBy === 'group')
				regrouped[entityGroupId] = group(result.rows, 0)[0].value;

			else if (groupBy === 'entity') {
				result.rows.forEach(function(row) { row.key[1] = row.key[3]; });
				result.rows = group(result.rows, 2); // keep project and entity
				result.rows.forEach(function(row) {
					regrouped[row.key[1]] = row.value;
				});
			}
			else if (groupBy === 'month') {
				result.rows = group(result.rows, 3); // keep project, year, month
				result.rows.forEach(function(row) {
					regrouped[row.key[1]+'-'+row.key[2]] = row.value;
				});
			}
			else if (groupBy === 'year') {
				result.rows = group(result.rows, 2); // keep project, year
				result.rows.forEach(function(row) {
					regrouped[row.key[1]] = row.value;
				});	
			}

			regrouped.total = computeTotal(regrouped);
			evaluateAll(project, regrouped);

			return retrieveMetadata(project, begin, end, groupBy, regrouped);
		});
	};

	var getIndicatorStats = function(indicator, begin, end, groupBy) {
		begin = moment(begin, 'YYYY-MM');
		end   = moment(end, 'YYYY-MM');

		return $q.when({});
	};

	return {
		getStatsColumns: getStatsColumns,
		getProjectStats: getProjectStats,
		getGroupStats: getGroupStats,
		getEntityStats: getEntityStats,
		getIndicatorStats: getIndicatorStats
	};
});

