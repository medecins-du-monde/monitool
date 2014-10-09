"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	// var db = new PouchDB('monitool');
	// db.sync('http://localhost:5984/monitool', {live: true});


	return new PouchDB('http://localhost:5984/monitool');
});




mtServices.factory('mtEntities', function($q, mtDatabase) {
	return {
		get: function(id) {
			mtDatabase.get(id).then(function(doc) {
				return new models[doc.type](doc);
			});
		}
	}
});





// Desk, centre, projet
// Periode
// Indicateur
mtServices.factory('mtStatistics', function($q, mtDatabase) {

	var views = {
		project:   'monitool/inputs_by_project_period_indicator',
		center:    'monitool/inputs_by_center_period_indicator',
		indicator: 'monitool/inputs_by_indicator_period_project'
	};

	/**
	 * Nest flat data from touchdb.
	 * Input: [{key: [1, 2, 3], value: 1}, {key: [1, 2, 4], value: 2}]
	 * Output: {1: {2: {3: 1, 4: 2}}}
	 */
	var regroup = function(data, levelSequence, levelId) {
		levelId = levelId || 0;

		var result = {};

		// Split data array into subarrays by data[xxx].keys[level]
		data.forEach(function(datum) {
			var key = datum.key[levelSequence[levelId]];

			if (!result[key])
				result[key] = [datum];
			else
				result[key].push(datum);
		});
		
		for (var key in result) {
			// result[key] is an array where all .keys[level] are the same.
			if (levelId < levelSequence.length - 1)
				result[key] = regroup(result[key], levelSequence, levelId + 1);
			else
				result[key] = result[key].map(function(e) { return e.value })
										 .reduce(function(memo, el) { return memo + el; });
		}
		
		return result;
	};

	// var compute = function(indicatorId, formula, scope) {
	// 	switch (definition.method) {
	// 		case 'percentage':
	// 			scope[indicatorId] = 100 * scope[formula.numerator] / scope[formula.denominator];
	// 			break;
	// 		default:
	// 			throw new Error('Unknown formula method');
	// 	}
	// };

	return {
		/**
		 * Retrieve structured inputs for a given entity, by month.
		 */
		getStatistics: function(type, id, begin, end) {
			var opt = {startkey: [id, begin], endkey: [id, end, {}]};

			return mtDatabase.query(views[type], opt).then(function(data) {
				return regroup(data.rows, [2, 1]);
			});
		},

	}
});



mtServices.factory('mtInput', function(mtDatabase, $q) {
	var getFormElementDescription = function(indicatorId, planning) {
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

		return promise.promise;
	};

	var getFormDescription = function(centerId, month) {
		return mtDatabase.query('monitool/project_by_center', {key: centerId, include_docs: true}).then(function(result) {
			var project = result.rows[0].doc;

			// filter indicators we do not want.
			var indicatorIds = Object.keys(project.planning).filter(function(indicatorId) {
				var p = project.planning[indicatorId];

				switch (p.periodicity) {
					case 'month': return p.from <= month && p.to >= month;
					case 'planned': return false; // @FIXME
					case 'quarter': return false; // @FIXME
					default: throw new Error('Invalid project periodicity.');
				}
			});

			var formElementsPromises = indicatorIds.map(function(indicatorId) {
				return getFormElementDescription(indicatorId, project.planning[indicatorId]);
			});

			return $q.all(formElementsPromises);
		});
	};

	var getFormValues = function(centerId, month) {
		return $q.when({});
	};

	var save = function(centerId, month, values) {

	};

	return {
		getFormDescription: getFormDescription,
		getFormValues: getFormValues,
		save: save
	};
});



