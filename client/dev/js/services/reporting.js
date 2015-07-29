"use strict";

angular.module('monitool.services.reporting', [])

	// TODO profiling this piece of code for perfs could not hurt.
	// we will see how bad if performs on the wild.
	.factory('mtReporting', function($q, Input) {

		var getColumns = function(groupBy, begin, end, entityId, project) {
			var type;
			if (!entityId)
				type = 'project';
			else if (project.inputGroups.find(function(g) { return g.id === entityId }))
				type = 'group';
			else
				type = 'entity';

			if (['year', 'quarter', 'month', 'week', 'day'].indexOf(groupBy) !== -1) {
				var begin      = moment(begin).startOf(groupBy === 'week' ? 'isoWeek' : groupBy),
					end        = moment(end).endOf(groupBy === 'week' ? 'isoWeek' : groupBy),
					dispFormat = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-MM-DD', 'day': 'YYYY-MM-DD'}[groupBy],
					idFormat   = {'year': 'YYYY', 'quarter': 'YYYY-[Q]Q', 'month': 'YYYY-MM', 'week': 'YYYY-[W]WW', 'day': 'YYYY-MM-DD'}[groupBy],
					current    = begin.clone(),
					cols       = [];

				while (current.isBefore(end) || current.isSame(end)) {
					cols.push({id: current.format(idFormat), name: current.format(dispFormat)});
					current.add(1, groupBy);
				}

				cols.push({id: 'total', name: 'Total'});

				return cols;
			}
			else if (groupBy === 'entity') {
				if (type === 'project')
					return project.inputEntities.concat([{id:'total',name:'Total'}]);
				else if (type === 'entity')
					return project.inputEntities.filter(function(e) { return e.id === entityId })
												.concat([{id:'total',name:'Total'}]);
				else  if (type === 'group') {
					var group = project.inputGroups.find(function(g) { return g.id === entityId });
					return project.inputEntities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
												.concat([{id:'total',name:'Total'}]);
				}
			}
			else if (groupBy === 'group') {
				if (type === 'project')
					return project.inputGroups;
				else if (type === 'entity')
					return project.inputGroups.filter(function(g) { return g.members.indexOf(entityId) !== -1 });
				else if (type === 'group')
					return project.inputGroups.filter(function(g) { return g.id === entityId });
			}
			else
				throw new Error('Invalid groupBy: ' + groupBy)
		};

		// var formatLogFrameReporting = function(project, result, cols, indicatorsById) {

		// 	var getUnassignedIndicatorIds = function(project) {
		// 		var assigned = {};
		// 		project.logicalFrame.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
		// 		project.logicalFrame.purposes.forEach(function(purpose) {
		// 			purpose.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
		// 			purpose.outputs.forEach(function(output) {
		// 				output.indicators.forEach(function(indicatorId) { assigned[indicatorId] = true; })
		// 			});
		// 		});

		// 		return Object.keys(project.indicators).filter(function(indicatorId) {
		// 			return !assigned[indicatorId];
		// 		});
		// 	};

		// 	var getStats = function(indent, indicatorId) {
		// 		return {
		// 			id: indicatorId,
		// 			name: indicatorsById[indicatorId].name,
		// 			unit: indicatorsById[indicatorId].unit,
		// 			baseline: project.indicators[indicatorId].baseline,
		// 			target: project.indicators[indicatorId].target,
		// 			showRed: project.indicators[indicatorId].showRed,
		// 			showYellow: project.indicators[indicatorId].showYellow,
		// 			cols: cols.map(function(col) {
		// 				return result[col.id] && result[col.id].compute[indicatorId] !== undefined ? result[col.id].compute[indicatorId] : null;
		// 			}),
		// 			type:'data',
		// 			dataType: "indicator",
		// 			indent: indent
		// 		};
		// 	};

		// 	var logFrameReport = [];
		// 	logFrameReport.push({type: 'header', text: project.logicalFrame.goal, indent: 0});
		// 	Array.prototype.push.apply(logFrameReport, project.logicalFrame.indicators.map(getStats.bind(null, 0)));
		// 	project.logicalFrame.purposes.forEach(function(purpose) {
		// 		logFrameReport.push({type: 'header', text: purpose.description, indent: 1});
		// 		Array.prototype.push.apply(logFrameReport, purpose.indicators.map(getStats.bind(null, 1)));
		// 		purpose.outputs.forEach(function(output) {
		// 			logFrameReport.push({type: 'header', text: output.description, indent: 2});
		// 			Array.prototype.push.apply(logFrameReport, output.indicators.map(getStats.bind(null, 2)));
		// 		});
		// 	});
		// 	Array.prototype.push.apply(logFrameReport, getUnassignedIndicatorIds(project).map(getStats.bind(null, 0)));

		// 	return logFrameReport;
		// };

		// var formatAggregatedDataReporting = function(project, result, cols) {
		// 	var getValue = function(v) { return typeof v == 'number' ? v : v.sum; };

		// 	var rows = [];
		// 	project.dataCollection.forEach(function(form) {
		// 		rows.push({ id: form.id, type: "header", text: form.name, indent: 0 });

		// 		form.aggregatedData.forEach(function(section) {
		// 			rows.push({ id: section.id, type: "header", text: section.name, indent: 1 });

		// 			section.elements.forEach(function(variable) {
		// 				var subRow = { id: variable.id, name: variable.name, indent: 1, type: "data", baseline: null, target: null };
		// 				subRow.cols = cols.map(function(col) {
		// 					try { return getValue(result[col.id].values[variable.id]); }
		// 					catch (e) {}
		// 				});

		// 				rows.push(subRow);

		// 				variable.partition1.forEach(function(p1) {
		// 					subRow.hasChildren = true;

		// 					var subSubRow = { id: makeUUID(), parentId: variable.id, name: p1.name, indent: 2, type: "data", baseline: null, target: null };
		// 					subSubRow.cols = cols.map(function(col) {
		// 						try { return getValue(result[col.id].values[variable.id][p1.id]); }
		// 						catch (e) {}
		// 					});

		// 					rows.push(subSubRow);

		// 					variable.partition2.forEach(function(p2) {
		// 						subSubRow.hasChildren = true;
								
		// 						rows.push({
		// 							id: makeUUID(), parentId: subSubRow.id, gParentId: subRow.id, name: p2.name, indent: 3, type: "data", baseline: null, target: null,
		// 							cols: cols.map(function(col) {
		// 								try { return getValue(result[col.id].values[variable.id][p1.id][p2.id]); }
		// 								catch (e) {}
		// 							})
		// 						});
		// 					});
		// 				});
		// 			});
		// 		});
		// 	});

		// 	return rows;
		// };






		var computeProjectActivityReporting = function(allInputs, project, groupBy) {
			var result = {};

			// Compute raw data.
			project.dataCollection.forEach(function(form) {
				// Take all inputs that match our form.
				var inputs = allInputs.filter(function(input) { return input.form === form.id; });

				// Regroup them by the requested groupBy
				var regrouped = Input.aggregate(inputs, form, groupBy, project.inputsGroups);

				// For each regrouped input, compute the indicators values.
				for (var regroupKey in regrouped) {
					// Create a hash to receive the final results if it's not done yet.
					if (!result[regroupKey])
						result[regroupKey] = {};

					var input = regrouped[regroupKey];

					// Copy raw data into final result.
					// we use guids across forms so no collision check is needed.
					var allValues = input.computeSums(); // This line compute all possible sums among partitions in the activity data.
					for (var rawId in allValues)
						result[regroupKey][rawId] = allValues[rawId];
				}
			});

			return result;
		};

		var computeProjectIndicatorReporting = function(allInputs, project, groupBy, indicatorsById) {
			// Compute activity reporting.
			var activityReporting = computeProjectActivityReporting(allInputs, project, groupBy),
				indicatorReporting = {};

			// for each month/entity/year/etc... on the activity reporting.
			for (var regroupKey in activityReporting) {
				// create an entry on the indicators reporting.
				indicatorReporting[regroupKey] = {};

				// iterate on all indicators.
				Object.keys(project.indicators).forEach(function(indicatorId) {
					var indicator = indicatorsById[indicatorId],
						indicatorMeta = project.indicators[indicatorId];

					// if the indicator has to be computed with a formula.
					if (indicatorMeta.formula) {
						// Retrieve the formula parameters from activity reporting.
						var localScope = {};

						for (var key in indicatorMeta.parameters) {
							var parameter = indicatorMeta.parameters[key],
								numFilters = parameter.filter.length;

							localScope[key] = 0;
							for (var filterId = 0; filterId < numFilters; ++filterId)
								localScope[key] += activityReporting[regroupKey][parameter.variable + '.' + parameter.filter[filterId]];
						}

						// and compute the result.
						var formula = indicator.formulas[indicatorMeta.formula];
						try {
							indicatorReporting[regroupKey][indicatorId] = Parser.evaluate(formula.expression, localScope);
						}
						catch (e) {
							console.log('failed to evaluate', formula.expression, 'against', JSON.stringify(localScope));
						}
					}
					// if the indicator can be directly taken from the activity report.
					else {
						// just extract the value.
						var numFilters = indicatorMeta.filter.length;

						indicatorReporting[regroupKey][indicatorId] = 0;
						for (var filterId = 0; filterId < numFilters; ++filterId)
							indicatorReporting[regroupKey][indicatorId] += activityReporting[regroupKey][indicatorMeta.variable + '.' + indicatorMeta.filter[filterId]];
					}
				});
			}

			return indicatorReporting;
		};



		// var computeIndicatorReporting = function(inputs, query, indicatorById) {
		// 	var rows = [];

		// 	query.projects.forEach(function(project) {
		// 		var projectInputs     = inputs.filter(function(input) { return input.project === project._id; }),
		// 			projectQuery      = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy},
		// 			projectResult     = computeProjectReporting(projectInputs, projectQuery, indicatorById);

		// 		// override id and name
		// 		var row = projectResult.indicatorRows.find(function(row) { return row.id === query.indicator._id; });
		// 		row.id = project._id;
		// 		row.name = project.name;
		// 		row.type = 'project'; // presentation hack, should not be here.
		// 		rows.push(row);

		// 		project.inputEntities.forEach(function(entity) {
		// 			var entityInputs = projectInputs.filter(function(input) { return input.entity === entity.id; }),
		// 				entityQuery  = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy, type: 'entity', id: entity.id},
		// 				entityResult = computeProjectReporting(entityInputs, entityQuery, indicatorById);

		// 			// override id and name
		// 			var row = entityResult.indicatorRows.find(function(row) { return row.id === query.indicator._id; });
		// 			row.id = entity.id;
		// 			row.name = entity.name;
		// 			row.type = 'entity'; // presentation hack, should not be here.
		// 			rows.push(row);
		// 		});
		// 	});

		// 	return { cols: getColumns(query), rows: rows };
		// };

		/**
		 * Given a project, find a default start date that makes sense to compute statistics
		 * - project is older than one year => one year ago
		 * - project started less than a year ago => project start
		 * - project starts in the future => now
		 */
		// var getDefaultStartDate = function(project) {
		// 	var result = moment().subtract(1, 'year');
		// 	if (project && result.isBefore(project.begin))
		// 		result = moment(project.begin)
		// 	return result.format('YYYY-MM-DD');
		// };

		// *
		//  * Given a project, find a default end date that makes sense to compute statistics
		//  * In fact, this always return the current date.
		 
		// var getDefaultEndDate = function(project) {
		// 	return moment().format('YYYY-MM-DD');
		// };

		return {
			getColumns: getColumns,
			// getDefaultStartDate: getDefaultStartDate,
			// getDefaultEndDate: getDefaultEndDate,

			computeProjectActivityReporting: computeProjectActivityReporting,
			computeProjectIndicatorReporting: computeProjectIndicatorReporting,

			// computeProjectReporting: computeProjectReporting,
			// computeIndicatorReporting: computeIndicatorReporting,
		};
	})

	