"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	// var db = new PouchDB('monitool2');

	// db.sync('http://localhost:5984/monitool', {live: true}).then(function(hello) {
	// 	console.log(hello);
	// }).catch(function(error) {
	// 	console.log(error)
	// });
	
	// return db;
	return new PouchDB('http://localhost:5984/monitool');
});


mtServices.factory('mtIndicators', function($q, mtDatabase) {
	var getIndicatorPlanningDetail = function(indicatorId, planning) {
		return mtDatabase.get(indicatorId).then(function(indicatorDef) {
			// succeed, we retrieved the definition, and we do not use a formula
			if (!planning.formula)
				return {id: indicatorDef._id, name: indicatorDef.name, dependencies: []};

			// fail, the specified formula does not exists.
			if (!indicatorDef.formulas[planning.formula])
				return $q.reject('There is no such formula.');

			// load dependencies
			var formula       = indicatorDef.formulas[planning.formula],
				dependencyIds = Object.values(formula.parameters);

			return mtDatabase.allDocs({keys: dependencyIds, include_docs: true}).then(function(dependencies) {
				// if we get less dependencies that asked, say something
				if (dependencies.rows.length != dependencyIds.length)
					return $q.reject('Could not find all dependencies.');

				return {
					id: indicatorDef._id,
					name: indicatorDef.name,
					formula: planning.formula,
					dependencies: dependencies.rows.map(function(indicator) {
						return {id: indicator.id, name: indicator.doc.name};
					}),
					compute: function(scope) {
						var localScope = {};
						for (var dependencyName in formula.parameters)
							localScope[dependencyName] = parseFloat(scope[formula.parameters[dependencyName]]) || 0;

						scope[indicatorDef._id] = math.eval(formula.expression, localScope);
					}
				};
			});
		});
	};

	var getPlanningDescription = function(project, month) {
		// filter indicators we do not want.
		var indicatorIds = Object.keys(project.planning || {});

		if (month)
			indicatorIds = indicatorIds.filter(function(indicatorId) {
				var p = project.planning[indicatorId];

				switch (p.periodicity) {
					case 'month': return p.from <= month && p.to >= month;
					case 'planned': return false; // @FIXME
					case 'quarter': return false; // @FIXME
					default: throw new Error('Invalid project periodicity.');
				}
			});

		var formElementsPromises = indicatorIds.map(function(indicatorId) {
			return getIndicatorPlanningDetail(indicatorId, project.planning[indicatorId]);
		});

		return $q.all(formElementsPromises);
	};

	var evaluate = function(planningDescription, scope) {
		var values = null, newValues = JSON.stringify(scope);

		while (values != newValues) {
			planningDescription.forEach(function(indicator) {
				indicator.compute && indicator.compute(scope);
			});

			values    = newValues;
			newValues = JSON.stringify(scope);
		}
	};

	return {
		evaluate: evaluate,
		getIndicatorPlanningDetail: getIndicatorPlanningDetail,
		getPlanningDescription: getPlanningDescription,
	};

});




mtServices.factory('mtStatistics', function($q, mtDatabase, mtIndicators) {
	var getPeriods = function(start, end) {
		if (start >= end)
			return [];

		start = start.split('-').map(function(e) { return parseInt(e); });
		end   = end.split('-').map(function(e) { return parseInt(e); });

		var currentMonth = start[1], currentYear = start[0], endMonth = end[1], endYear = end[0], periods = [];

		while (currentMonth !== endMonth || currentYear !== endYear) {
			periods.push(currentYear + '-' + (currentMonth < 10 ? '0': '') + currentMonth);

			if (currentMonth == 12) {
				currentYear++;
				currentMonth = 1;
			}
			else
				currentMonth++;
		}
		periods.push(currentYear + '-' + (currentMonth < 10 ? '0': '') + currentMonth);

		return $q.when(periods);
	};

	var getIndicatorsRows = function(type, ids) {
		if (type === 'indicator') {

		}
		else {
			// retrieve project ids
			var projectIdsPromise = $q.when(ids);
			if (type === 'center')
				projectIdsPromise = mtDatabase.query('monitool/project_by_center', {keys: ids}).then(function(result) {
					var r = {};
					result.rows.forEach(function(row) { r[row.id] = true; });
					return Object.keys(r);
				});
			
			// retrieve projects
			return projectIdsPromise.then(function(projectIds) {
				return $q.all(projectIds.map(function(id) { return mtDatabase.get(id); }));
			})
			// retrieve form descriptions
			.then(function(projects) {
				return $q.all(projects.map(function(project) { return mtIndicators.getPlanningDescription(project); }));
			})
			// then merge them
			.then(function(planningDescriptions) {

				/**
				 * this is a bit more complicated that meets the eye
				 * We have multiple projects, that have different indicators, but some are shared.
				 * 
				 * We want to make sure that the data we show is valid and assume that data typed by the user is always summable
				 * (wich is wrong).
				 *
				 * => Rewrite this ASAP adding fields so that the users can declare which data is summable or not (over time or space).
				 * For now, this code only keeps the intersection of indicators with the same formula (which we know will work with simple
				 * percentages, but is wrong).
				 */

				var base = planningDescriptions[0],
					numPlannings = planningDescriptions.length;

				// This could be done in O(n) with sorted arrays, instead of nesting 3 loops. Fix it if it happens to be slow
				// on the profiler.
				for (var i = 1; i < planningDescriptions.length; ++i) {
					var planning = planningDescriptions[i];
					base = base.filter(function(basePlanningElt) {
						return planning.some(function(planningElt) {
							return planningElt.id === basePlanningElt.id && planningElt.formula === basePlanningElt.formula;
						});
					});
				}

				return base;
			});
		}
	};

	/**
	 * Nest flat data from touchdb.
	 * Input: [{key: [1, 2, 3], value: 1}, {key: [1, 2, 4], value: 2}]
	 * Output: {1: {2: {3: 1, 4: 2}}}
	 */
	var regroup = function(result, data, levelSequence, levelId) {
		levelId = levelId || 0;

		var intermediate = {};

		// Split data array into subarrays by data[xxx].keys[level]
		data.forEach(function(datum) {
			var key = datum.key[levelSequence[levelId]];

			if (!intermediate[key])
				intermediate[key] = [datum];
			else
				intermediate[key].push(datum);
		});
		
		for (var key in intermediate) {
			// result[key] is an array where all .keys[level] are the same.
			if (levelId < levelSequence.length - 1)
				result[key] = regroup(result[key] || {}, intermediate[key], levelSequence, levelId + 1);
			else
				result[key] = (result[key] || 0) + intermediate[key].map(function(e) { return e.value * 1 })
									   .reduce(function(memo, el) { return memo + el; });
		}
		
		return result;
	};

	var getData = function(type, ids, begin, end) {
		var views = {
			project:   'monitool/inputs_by_project_period_indicator',
			center:    'monitool/inputs_by_center_period_indicator',
			indicator: 'monitool/inputs_by_indicator_period_project'
		};

		return $q.all(ids.map(function(id) {
			return mtDatabase.query(views[type], {startkey: [id, begin], endkey: [id, end, {}]});
		})).then(function(sources) {
			var result = {};

			sources.forEach(function(source) {
				regroup(result, source.rows, [1, 2])
			});

			return result;
		});
	};

	return {
		/**
		 * Retrieve structured inputs for a given entity, by month.
		 */
		getStatistics: function(type, ids, begin, end) {
			return $q.all([
				getPeriods(begin, end),
				getIndicatorsRows(type, ids),
				getData(type, ids, begin, end)
			]).then(function(result) {
				if (type === 'project' || type === 'center')
					for (var period in result[2])
						mtIndicators.evaluate(result[1], result[2][period]);

				return {periods: result[0], lines: result[1], data: result[2]};
			});
		}
	}
});



mtServices.factory('mtInput', function(mtDatabase) {
	var getFormValues = function(centerId, month) {
		return mtDatabase.get('input:' + centerId + ':' + month)
			.then(function(record) { return record.indicators; })
			.catch(function(error) { return {}; });
	};

	var saveFormValues = function(centerId, month, values) {
		mtDatabase.query('monitool/project_by_center', {key: centerId, include_docs: true}).then(function(project) {
			project = project.rows[0].doc;

			var record = {
				_id: 'input:' + centerId + ':' + month,
				type: "input",
				project: project._id,
				center: centerId,
				period: month,
				indicators: values
			};

			mtDatabase.get('input:' + centerId + ':' + month).then(function(oldRecord) {
				record._rev = oldRecord._rev;
				return mtDatabase.put(record);
			}).catch(function(error) {
				return mtDatabase.put(record);
			});
		});
	};

	return {
		getFormValues: getFormValues,
		saveFormValues: saveFormValues
	};
});



