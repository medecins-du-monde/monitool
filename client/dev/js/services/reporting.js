"use strict";

var reportingServices = angular.module('monitool.services.reporting', []);

// FIXME this should be in a directive and should not touch the model.
reportingServices.factory('mtFormula', function($q) {
	return {
		/**
		 * In: {expression: "a + b", parameters: {a: 42}}
		 * Out {expression: "a + b", parameters: {a: 42}, symbols: ['a', 'b'], isValid: false}
		 */
		annotate: function(formula) {
			var symbols;

			formula.__isValid = true;
			try {
				formula.__symbols = Parser.parse(formula.expression).variables();
			}
			catch (e) { 
				formula.__symbols = [];
				formula.__isValid = false;
			}

			formula.__symbols.forEach(function(symbol) {
				if (!formula.parameters[symbol])
					formula.parameters[symbol] = {name: "", geoAggregation: "sum", timeAggregation: "sum"};

				if (!formula.parameters[symbol].name.length)
					formula.__isValid = false;
			})

			if (!formula.name)
				formula.__isValid = false;
		},

		/**
		 * Clean up
		 */
		clean: function(formula) {
			for (var key in formula.parameters)
				if (formula.__symbols.indexOf(key) === -1)
					delete formula.parameters[key];
		},
		
	}
});

// TODO profiling this piece of code for perfs could not hurt.
// we will see how bad if performs on the wild.
reportingServices.factory('mtReporting', function($q, mtFetch, mtCompute, mtRegroup) {

	var getColumns = function(query) {
		if (['year', 'quarter', 'month', 'week', 'day'].indexOf(query.groupBy) !== -1) {
			var begin      = moment(query.begin, 'YYYY-MM-DD').startOf(query.groupBy === 'week' ? 'isoWeek' : query.groupBy),
				end        = moment(query.end, 'YYYY-MM-DD').endOf(query.groupBy === 'week' ? 'isoWeek' : query.groupBy),
				dispFormat = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-MM-DD', 'day': 'YYYY-MM-DD'}[query.groupBy],
				idFormat   = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-[W]WW', 'day': 'YYYY-MM-DD'}[query.groupBy],
				current    = begin.clone(),
				cols       = [];

			while (current.isBefore(end) || current.isSame(end)) {
				cols.push({id: current.format(idFormat), name: current.format(dispFormat)});
				current.add(1, query.groupBy);
			}

			cols.push({id: 'total', name: 'Total'});

			return cols;
		}
		else if (query.groupBy === 'entity') {
			if (query.type === 'project')
				return query.project.inputEntities.concat([{id:'total',name:'Total'}]);
			else if (query.type === 'entity')
				return query.project.inputEntities.filter(function(e) { return e.id === query.id })
											.concat([{id:'total',name:'Total'}]);
			else  if (query.type === 'group') {
				var group = query.project.inputGroups.find(function(g) { return g.id === query.id });
				return query.project.inputEntities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
											.concat([{id:'total',name:'Total'}]);
			}
		}
		else if (query.groupBy === 'group') {
			if (query.type === 'project')
				return query.project.inputGroups;
			else if (query.type === 'entity')
				return query.project.inputGroups.filter(function(g) { return g.members.indexOf(query.id) !== -1 });
			else if (query.type === 'group')
				return query.project.inputGroups.filter(function(g) { return g.id === query.id });
		}
		else
			throw new Error('Invalid groupBy: ' + query.groupBy)
	};

	/**
	 * Retrieve from server all inputs that match (between 2 dates)
	 * - a given project
	 * - a given indicator
	 * - a group or an entity
	 */
	var getInputs = function(query) {
		// Retrieve all relevant inputs.
		var options;
		if (query.type === 'project' || query.type === 'group')
			options = {mode: 'project_inputs', begin: query.begin, end: query.end, projectId: query.project._id};

		else if (query.type === 'entity')
			options = {mode: 'entity_inputs', begin: query.begin, end: query.end, entityId: query.id};

		else if (query.type === 'indicator')
			// we want all inputs from a form with the relevant formId
			options = {
				mode: 'form_inputs',
				begin: query.begin, end: query.end,
				formId: query.projects.map(function(p) {
					var form = p.dataCollection.find(function(f) {
						return !!f.fields.find(function(field) { return query.indicator._id === field.indicatorId });
					});
					return form ? form.id : null;
				}).filter(function(form) { return form; })
			};
		else
			throw new Error('query.type must be indicator, project, group or entity');

		return mtFetch.inputs(options).then(function(inputs) {
			// Discard all inputs that are not relevant.
			if (query.type === 'project')
				inputs = inputs.filter(function(input) { return input.project === query.project._id; });

			else if (query.type === 'entity')
				inputs = inputs.filter(function(input) { return input.entity === query.id; });

			else if (query.type === 'group')
				inputs = inputs.filter(function(input) {
					var project = query.project || query.projects.find(function(p) { return p._id === input.project; }),
						group   = project.inputGroups.find(function(g) { return g.id === query.id; });

					return group.members.indexOf(input.entity) !== -1;
				});

			return inputs;
		});
	};

	var getPreprocessedInputs = function(query) {
		return getInputs(query).then(function(inputs) {
			var numInputs = inputs.length;

			// For all of them, compute indicators leafs.
			for (var i = 0; i < numInputs; ++i) {
				var input   = inputs[i],
					project = query.project || query.projects.find(function(p) { return p._id === input.project; }),
					form    = project.dataCollection.find(function(f) { return f.id === input.form; });
				
				mtCompute.sanitizeRawData(input.values, form);
				input.compute = mtCompute.computeIndicatorsLeafsFromRaw(input.values, form);
				input.aggregation = mtRegroup.computeAggregationFields(input, project);
			}

			return inputs;
		});
	};

	var getIndicatorsRowsFromReporting = function(project, result, cols, indicatorsById) {

		var getUnassignedIndicatorIds = function(project) {
			var assigned = {};
			project.logicalFrame.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
			project.logicalFrame.purposes.forEach(function(purpose) {
				purpose.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
				purpose.outputs.forEach(function(output) {
					output.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
				});
			});

			return Object.keys(project.indicators).filter(function(indicatorId) {
				return !assigned[indicatorId];
			});
		};

		var getStats = function(indent, indicatorId) {
			return {
				id: indicatorId,
				name: indicatorsById[indicatorId].name,
				unit: indicatorsById[indicatorId].unit,
				baseline: project.indicators[indicatorId].baseline,
				target: project.indicators[indicatorId].target,
				showRed: project.indicators[indicatorId].showRed,
				showYellow: project.indicators[indicatorId].showYellow,
				cols: cols.map(function(col) {
					return result[col.id] && result[col.id].compute[indicatorId] !== undefined ? result[col.id].compute[indicatorId] : null;
				}),
				type:'data',
				dataType: "indicator",
				indent: indent
			};
		};

		var logFrameReport = [];
		logFrameReport.push({type: 'header', text: project.logicalFrame.goal, indent: 0});
		Array.prototype.push.apply(logFrameReport, project.logicalFrame.indicators.map(getStats.bind(null, 0)));
		project.logicalFrame.purposes.forEach(function(purpose) {
			logFrameReport.push({type: 'header', text: purpose.description, indent: 1});
			Array.prototype.push.apply(logFrameReport, purpose.indicators.map(getStats.bind(null, 1)));
			purpose.outputs.forEach(function(output) {
				logFrameReport.push({type: 'header', text: output.description, indent: 2});
				Array.prototype.push.apply(logFrameReport, output.indicators.map(getStats.bind(null, 2)));
			});
		});
		Array.prototype.push.apply(logFrameReport, getUnassignedIndicatorIds(project).map(getStats.bind(null, 0)));

		return logFrameReport;
	};

	var getRawDataRowsFromReporting = function(project, result, cols) {
		var sum = function(hash) {
			if (typeof hash === 'number')
				return hash;
			
			var result = 0;
			for (var key in hash)
				result += sum(hash[key])
			return result;
		};

		var rows = [];

		project.dataCollection.forEach(function(form) {
			rows.push({ id: form.id, type: "header", text: form.name, indent: 0 });

			form.rawData.forEach(function(section) {
				rows.push({ id: section.id, type: "header", text: section.name, indent: 1 });

				section.elements.forEach(function(variable) {
					var subRow = { id: variable.id, name: variable.name, indent: 1, type: "data", baseline: null, target: null };
					subRow.cols = cols.map(function(col) {
						if (result[col.id] !== undefined
							&& result[col.id].values[variable.id] !== undefined)
							return sum(result[col.id].values[variable.id]);
						else
							return null;
					});

					rows.push(subRow);

					variable.partition1.forEach(function(p1) {
						subRow.hasChildren = true;

						var subSubRow = { id: makeUUID(), parentId: variable.id, name: p1.name, indent: 2, type: "data", baseline: null, target: null };
						subSubRow.cols = cols.map(function(col) {
							if (result[col.id] !== undefined
								&& result[col.id].values[variable.id] !== undefined
								&& result[col.id].values[variable.id][p1.id] !== undefined)
								return sum(result[col.id].values[variable.id][p1.id]);
							else
								return null;
						});

						rows.push(subSubRow);

						variable.partition2.forEach(function(p2) {
							subSubRow.hasChildren = true;
							
							rows.push({
								id: makeUUID(), parentId: subSubRow.id, name: p2.name, indent: 3, type: "data", baseline: null, target: null,
								cols: cols.map(function(col) {
									if (result[col.id] !== undefined
										&& result[col.id].values[variable.id] !== undefined
										&& result[col.id].values[variable.id][p1.id] !== undefined
										&& result[col.id].values[variable.id][p1.id][p2.id] !== undefined)
										return sum(result[col.id].values[variable.id][p1.id][p2.id]);
									else
										return null;
								})
							});
						});
					});
				});
			});
		});

		return rows;
	};

	var getProjectReporting = function(preprocessedInputs, query, indicatorsById) {
		var cols = getColumns(query), result = {};

		query.project.dataCollection.forEach(function(form) {
			// Take all inputs that match our form.
			var inputs = preprocessedInputs.filter(function(input) { return input.form === form.id; });

			// Regroup them by the requested groupBy
			var regrouped = mtRegroup.regroupInputs(inputs, form, query.groupBy, indicatorsById);

			// For each regrouped result, compute the indicators values.
			for (var regroupKey in regrouped) {

				regrouped[regroupKey].compute = mtCompute.computeIndicatorsFromLeafs(regrouped[regroupKey].compute, form, indicatorsById);

				// we now have {values: {rawId: 45, rawId: {partId: 45}, ... }, compute: {indId: 45}}
				if (!result[regroupKey])
					result[regroupKey] = {values: {}, compute: {}};

				// we must take care when computing the union of all forms,
				// => because after aggregating over time, we may have conflicts on indicators.
				// (if 1 indicator gets computed by two different forms.
				for (var indicatorId in regrouped[regroupKey].compute) {
					result[regroupKey].compute[indicatorId] =
						result[regroupKey].compute[indicatorId] ?
						'FORM_CONFLICT' :
						regrouped[regroupKey].compute[indicatorId];
				}

				// variables are different: we use guids across forms so there should be no problems at all
				for (var rawId in regrouped[regroupKey].values)
					result[regroupKey].values[rawId] = regrouped[regroupKey].values[rawId];
			}
		});

		return {
			cols: cols,
			indicatorRows: getIndicatorsRowsFromReporting(query.project, result, cols, indicatorsById),
			rawDataRows: getRawDataRowsFromReporting(query.project, result, cols)
		};
	};


	var getIndicatorReporting = function(inputs, query, indicatorById) {
		var rows = [];

		query.projects.forEach(function(project) {
			var projectInputs     = inputs.filter(function(input) { return input.project === project._id; }),
				projectQuery      = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy},
				projectResult     = getProjectReporting(projectInputs, projectQuery, indicatorById);

			// override id and name
			var row = projectResult.rows.find(function(row) { return row.id === query.indicator._id; });
			row.id = project._id;
			row.name = project.name;
			row.type = 'project'; // presentation hack, should not be here.
			rows.push(row);

			project.inputEntities.forEach(function(entity) {
				var entityInputs = projectInputs.filter(function(input) { return input.entity === entity.id; }),
					entityQuery  = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy, type: 'entity', id: entity.id},
					entityResult = getProjectReporting(entityInputs, entityQuery, indicatorById);

				// override id and name
				var row = entityResult.rows.find(function(row) { return row.id === query.indicator._id; });
				row.id = entity.id;
				row.name = entity.name;
				row.type = 'entity'; // presentation hack, should not be here.
				rows.push(row);
			});
		});

		return { cols: getColumns(query), rows: rows };
	};

	var getDefaultStartDate = function(project) {
		var result = moment().subtract(1, 'year');
		if (project && result.isBefore(project.begin))
			result = moment(project.begin)
		return result.format('YYYY-MM-DD');
	};

	var getDefaultEndDate = function(project) {
		return moment().format('YYYY-MM-DD');
	};

	return {
		getColumns: getColumns,
		getDefaultStartDate: getDefaultStartDate,
		getDefaultEndDate: getDefaultEndDate,

		getPreprocessedInputs: getPreprocessedInputs,
		getProjectReporting: getProjectReporting,
		getIndicatorReporting: getIndicatorReporting,
	};
});

