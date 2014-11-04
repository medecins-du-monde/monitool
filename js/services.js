"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	var r = {};
	
	r.local = new PouchDB('monitool3');
	r.remote = new PouchDB('http://localhost:5984/monitool', {adapter: 'http'});

	// var db = new PouchDB('monitool');
	// db.sync('http://localhost:5984/monitool', {live: true}).then(function(hello) {
	// 	console.log(hello);
	// }).catch(function(error) {
	// 	console.log(error)
	// });
	// return db;

	return r.remote;
});


mtServices.factory('mtIndicators', function($q, mtDatabase) {

	var evaluate = function(form, scope) {
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

	var getProjectStatsColumns = function(project, begin, end, groupBy) {
		begin = moment(begin);
		end   = moment(end);

		if (groupBy === 'month' || groupBy === 'year') {
			var format  = groupBy === 'month' ? 'YYYY-MM' : 'YYYY',
				current = begin.clone();

			var cols = [];
			while (current.isBefore(end) || current.isSame(end)) {
				cols.push({id: current.format(format), name: current.format(format)});
				current.add(1, groupBy);
			}
			return cols;
		}
		else if (groupBy === 'entity')
			return project.inputEntities;
		else if (groupBy === 'group')
			return project.inputGroups;
		else
			throw new Error('Invalid groupBy: ' + groupBy)
	};

	var getProjectRawStats = function(project, begin, end, groupBy) {
		begin = moment(begin);
		end   = moment(end);

		var view    = 'monitool/inputs_by_project_year_month_entity',
			options = {startkey: [project._id, begin.format('YYYY'), begin.format('MM')], endkey: [project._id, end.format('YYYY'), end.format('MM'), {}]};

		if (groupBy === 'year')
			options.group_level = 2;
		else if (groupBy === 'month')
			options.group_level = 3;
		else if (groupBy === 'entity' || groupBy === 'group')
			options.group_level = 4;
		else
			throw new Error('Invalid groupBy: ' + groupBy);

		return mtDatabase.query(view, options).then(function(result) {
			var regrouped = {};

			// regroup db results if needed
			if (groupBy === 'entity' || groupBy === 'group') {
				result.rows.forEach(function(row) { row.key[1] = row.key[3]; });
				result.rows = group(result.rows, 2);
			}
			else if (groupBy === 'month')
				result.rows.forEach(function(row) { row.key[1] += '-' + row.key[2]; });

			result.rows.forEach(function(row) { regrouped[row.key[1]] = row.value; });

			// process groups
			if (groupBy === 'group') {
				var regrouped2 = {};
				project.inputGroups.forEach(function(inputGroup) {
					regrouped2[inputGroup.id] = reduce(inputGroup.members.map(function(entityId) {
						return regrouped[entityId] || {};
					}));
				});
				regrouped = regrouped2;
			}

			// compute total
			var total = {};
			for (var key in regrouped)
				for (var indicatorId in regrouped[key])
					if (total[indicatorId])
						total[indicatorId] += regrouped[key][indicatorId];
					else
						total[indicatorId] = regrouped[key][indicatorId];
			regrouped.total = total;

			// compute indicators
			var fakeForm = {fields:{}}; // wrong!
			project.dataCollection.forEach(function(form) {
				for (var key in form.fields)
					fakeForm.fields[key] = form.fields[key];
			});
			for (var key in regrouped)
				evaluate(fakeForm, regrouped[key]);

			return regrouped;
		});
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
				metadata.totalPart = Math.round(100 * metadata.value / regrouped.total[indicatorId]) + '%';

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
		return getProjectRawStats(project, begin, end, groupBy).then(function(regrouped) {
			return retrieveMetadata(project, begin, end, groupBy, regrouped);
		});
	};

	return {
		evaluate: evaluate,
		reduce: reduce,
		group: group,
		getProjectStatsColumns: getProjectStatsColumns,
		getProjectRawStats: getProjectRawStats,
		getProjectStats: getProjectStats
	};
});

// mtServices.factory('mtStatistics', function($q, mtDatabase, mtIndicators) {
// 	var getPeriods = function(start, end) {
// 		if (start >= end)
// 			return [];

// 		start = start.split('-').map(function(e) { return parseInt(e); });
// 		end   = end.split('-').map(function(e) { return parseInt(e); });

// 		var currentMonth = start[1], currentYear = start[0], endMonth = end[1], endYear = end[0], periods = [];

// 		while (currentMonth !== endMonth || currentYear !== endYear) {
// 			periods.push(currentYear + '-' + (currentMonth < 10 ? '0': '') + currentMonth);

// 			if (currentMonth == 12) {
// 				currentYear++;
// 				currentMonth = 1;
// 			}
// 			else
// 				currentMonth++;
// 		}
// 		periods.push(currentYear + '-' + (currentMonth < 10 ? '0': '') + currentMonth);

// 		return $q.when(periods);
// 	};

// 	var getIndicatorsRows = function(type, ids) {
// 		if (type === 'indicator') {

// 		}
// 		else {
// 			// retrieve project ids
// 			var projectIdsPromise = $q.when(ids);
// 			if (type === 'center')
// 				projectIdsPromise = mtDatabase.query('monitool/project_by_center', {keys: ids}).then(function(result) {
// 					var r = {};
// 					result.rows.forEach(function(row) { r[row.id] = true; });
// 					return Object.keys(r);
// 				});
			
// 			// retrieve projects
// 			return projectIdsPromise.then(function(projectIds) {
// 				return $q.all(projectIds.map(function(id) { return mtDatabase.get(id); }));
// 			})
// 			// retrieve form descriptions
// 			.then(function(projects) {
// 				return $q.all(projects.map(function(project) { return mtIndicators.getPlanningDescription(project); }));
// 			})
// 			// then merge them
// 			.then(function(planningDescriptions) {

// 				/**
// 				 * this is a bit more complicated that meets the eye
// 				 * We have multiple projects, that have different indicators, but some are shared.
// 				 * 
// 				 * We want to make sure that the data we show is valid and assume that data typed by the user is always summable
// 				 * (wich is wrong).
// 				 *
// 				 * => Rewrite this ASAP adding fields so that the users can declare which data is summable or not (over time or space).
// 				 * For now, this code only keeps the intersection of indicators with the same formula (which we know will work with simple
// 				 * percentages, but is wrong).
// 				 */

// 				var base = planningDescriptions[0],
// 					numPlannings = planningDescriptions.length;

// 				// This could be done in O(n) with sorted arrays, instead of nesting 3 loops. Fix it if it happens to be slow
// 				// on the profiler.
// 				for (var i = 1; i < planningDescriptions.length; ++i) {
// 					var planning = planningDescriptions[i];
// 					base = base.filter(function(basePlanningElt) {
// 						return planning.some(function(planningElt) {
// 							return planningElt.id === basePlanningElt.id && planningElt.formula === basePlanningElt.formula;
// 						});
// 					});
// 				}

// 				return base;
// 			});
// 		}
// 	};

// 	*
// 	 * Nest flat data from touchdb.
// 	 * Input: [{key: [1, 2, 3], value: 1}, {key: [1, 2, 4], value: 2}]
// 	 * Output: {1: {2: {3: 1, 4: 2}}}
	 
// 	var regroup = function(result, data, levelSequence, levelId) {
// 		levelId = levelId || 0;

// 		var intermediate = {};

// 		// Split data array into subarrays by data[xxx].keys[level]
// 		data.forEach(function(datum) {
// 			var key = datum.key[levelSequence[levelId]];

// 			if (!intermediate[key])
// 				intermediate[key] = [datum];
// 			else
// 				intermediate[key].push(datum);
// 		});
		
// 		for (var key in intermediate) {
// 			// result[key] is an array where all .keys[level] are the same.
// 			if (levelId < levelSequence.length - 1)
// 				result[key] = regroup(result[key] || {}, intermediate[key], levelSequence, levelId + 1);
// 			else
// 				result[key] = (result[key] || 0) + intermediate[key].map(function(e) { return e.value * 1 })
// 									   .reduce(function(memo, el) { return memo + el; });
// 		}
		
// 		return result;
// 	};

// 	var getData = function(type, ids, begin, end) {
// 		var views = {
// 			project:   'monitool/inputs_by_project_period_indicator',
// 			center:    'monitool/inputs_by_center_period_indicator',
// 			indicator: 'monitool/inputs_by_indicator_period_project'
// 		};

// 		return $q.all(ids.map(function(id) {
// 			return mtDatabase.query(views[type], {startkey: [id, begin], endkey: [id, end, {}]});
// 		})).then(function(sources) {
// 			var result = {};

// 			sources.forEach(function(source) {
// 				regroup(result, source.rows, [1, 2])
// 			});

// 			return result;
// 		});
// 	};

// 	return {
// 		/**
// 		 * Retrieve structured inputs for a given entity, by month.
// 		 */
// 		getStatistics: function(type, ids, begin, end) {
// 			return $q.all([
// 				getPeriods(begin, end),
// 				getIndicatorsRows(type, ids),
// 				getData(type, ids, begin, end)
// 			]).then(function(result) {
// 				if (type === 'project' || type === 'center')
// 					for (var period in result[2])
// 						mtIndicators.evaluate(result[1], result[2][period]);

// 				return {periods: result[0], lines: result[1], data: result[2]};
// 			});
// 		}
// 	}
// });



// mtServices.factory('mtInput', function(mtDatabase) {
// 	var getFormValues = function(centerId, month) {
// 		return mtDatabase.get('input:' + centerId + ':' + month)
// 			.then(function(record) { return record.indicators; })
// 			.catch(function(error) { return {}; });
// 	};

// 	var saveFormValues = function(centerId, month, values) {
// 		mtDatabase.query('monitool/project_by_center', {key: centerId, include_docs: true}).then(function(project) {
// 			project = project.rows[0].doc;

// 			var record = {
// 				_id: 'input:' + centerId + ':' + month,
// 				type: "input",
// 				project: project._id,
// 				center: centerId,
// 				period: month,
// 				indicators: values
// 			};

// 			mtDatabase.get('input:' + centerId + ':' + month).then(function(oldRecord) {
// 				record._rev = oldRecord._rev;
// 				return mtDatabase.put(record);
// 			}).catch(function(error) {
// 				return mtDatabase.put(record);
// 			});
// 		});
// 	};

// 	return {
// 		getFormValues: getFormValues,
// 		saveFormValues: saveFormValues
// 	};
// });



