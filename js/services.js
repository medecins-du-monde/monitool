"use strict";

var mtServices = angular.module('MonitoolServices', ['pouchdb']);

mtServices.factory('mtDatabase', function(PouchDB) {
	var db = new PouchDB('monitool');

	db.put({
		_id: '_design/monitool',
		views: {
			by_type: {
				map: function(doc) {
					emit(doc.type);
				}.toString()
			},

			inputs_by_project_period_indicator: {
				map: function(doc) {
					if (doc.type === 'input')
						for (var indicator in doc.indicators)
							emit([doc.project, doc.period, indicator], doc.indicators[indicator]);
				}.toString()
			},

			inputs_by_center_period_indicator: {
				map: function(doc) {
					if (doc.type === 'input')
						for (var indicator in doc.indicators)
							emit([doc.center, doc.period, indicator], doc.indicators[indicator]);
				}.toString()
			},

			inputs_by_indicator_period_project: {
				map: function(doc) {
					if (doc.type === 'input')
						for (var indicator in doc.indicators)
							emit([indicator, doc.period, doc.project], doc.indicators[indicator]);
				}.toString()
			}
		}
	});

	db.sync('http://localhost:5984/monitool', {live: true});

	return db;
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

