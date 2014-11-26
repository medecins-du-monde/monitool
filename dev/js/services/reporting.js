"use strict";

var reportingServices = angular.module('monitool.services.reporting', ['monitool.services.database']);

reportingServices.factory('mtFormula', function($q, mtDatabase) {
	return {
		/**
		 * In: {expression: "a + b", parameters: {a: 42}}
		 * Out {expression: "a + b", parameters: {a: 42}, symbols: ['a', 'b'], isValid: false}
		 */
		annotate: function(formula) {
			// Helper function to recursively retrieve symbols from abstract syntax tree.
			var getSymbolsRec = function(root, symbols) {
				if (root.type === 'OperatorNode' || root.type === 'FunctionNode')
					root.params.forEach(function(p) { getSymbolsRec(p, symbols); });
				else if (root.type === 'SymbolNode')
					symbols[root.name] = true;

				return Object.keys(symbols);
			};
			
			formula.isValid = true;
			try {
				var expression = math.parse(formula.expression);
				// do not allow empty formula
				if (expression.type === 'ConstantNode' && expression.value === 'undefined')
					throw new Error();
				
				formula.symbols = getSymbolsRec(expression, {});
			}
			catch (e) { 
				formula.symbols = [];
				formula.isValid = false;
			}

			var numSymbols = formula.symbols.length;
			for (var i = 0; i < numSymbols; ++i)
				if (!formula.parameters[formula.symbols[i]])
					formula.isValid = false;

			if (!formula.name)
				formula.isValid = false;
		},

		/**
		 * Clean up
		 */
		clean: function(formula) {
			delete formula.isValid;
			delete formula.symbols;
		},
		
	}
});


reportingServices.factory('mtReporting', function($q, mtDatabase) {

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

	var exportProjectStats = function(cols, project, indicatorsById, data) {
		var csvDump = 'os;res;indicator';
		cols.forEach(function(col) { csvDump += ';' + col.name; })
		csvDump += "\n";

		project.logicalFrame.indicators.forEach(function(indicatorId) {
			csvDump += 'None;None;' + indicatorsById[indicatorId].name;
			cols.forEach(function(col) {
				csvDump += ';';
				try { csvDump += data[col.id][indicatorId].value }
				catch (e) {}
			});
			csvDump += "\n";
		});

		project.logicalFrame.purposes.forEach(function(purpose) {
			purpose.indicators.forEach(function(indicatorId) {
				csvDump += purpose.description + ';None;' + indicatorsById[indicatorId].name;
				cols.forEach(function(col) {
					csvDump += ';';
					try { csvDump += data[col.id][indicatorId].value }
					catch (e) {}
				});
				csvDump += "\n";
			});

			purpose.outputs.forEach(function(output) {
				output.indicators.forEach(function(indicatorId) {
					csvDump += purpose.description + ';' + output.description + ';' + indicatorsById[indicatorId].name;
					cols.forEach(function(col) {
						csvDump += ';';
						try { csvDump += data[col.id][indicatorId].value }
						catch (e) {}
					});
					csvDump += "\n";
				});
			});
		});

		return csvDump;
	};

	var exportIndicatorStats = function(cols, projects, indicator, data) {
		var csvDump = 'type;nom';

		// header
		cols.forEach(function(col) { csvDump += ';' + col.name; })
		csvDump += "\n";

		projects.forEach(function(project) {
			csvDump += 'project;' + project.name;
			cols.forEach(function(col) {
				csvDump += ';';
				try { csvDump += data[col.id][project._id][indicator._id].value }
				catch (e) {}
			});
			csvDump += "\n";

			project.inputEntities.forEach(function(entity) {
				csvDump += 'entity;' + entity.name;
				cols.forEach(function(col) {
					csvDump += ';';
					try { csvDump += data[col.id][project._id][indicator._id].value; }
					catch (e) {}
				});
				csvDump += "\n";
			});
		});

		return csvDump;
	};


	return {
		exportProjectStats:   exportProjectStats,
		exportIndicatorStats: exportIndicatorStats,
		evaluateScope:        evaluateScope,
		getStatsColumns:      getStatsColumns,
		getProjectStats:      getProjectStats,
		getGroupStats:        getGroupStats,
		getEntityStats:       getEntityStats,
		getIndicatorStats:    getIndicatorStats
	};
});

