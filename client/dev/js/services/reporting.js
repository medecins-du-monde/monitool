"use strict";

angular.module('monitool.services.reporting', [])

	// TODO profiling this piece of code for perfs could not hurt.
	// we will see how bad if performs on the wild.
	.factory('mtReporting', function($q, Input) {

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

		var formatLogFrameReporting = function(project, result, cols, indicatorsById) {

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

		var formatRawDataReporting = function(project, result, cols) {
			var getValue = function(v) { return typeof v == 'number' ? v : v.sum; };

			var rows = [];
			project.dataCollection.forEach(function(form) {
				rows.push({ id: form.id, type: "header", text: form.name, indent: 0 });

				form.rawData.forEach(function(section) {
					rows.push({ id: section.id, type: "header", text: section.name, indent: 1 });

					section.elements.forEach(function(variable) {
						var subRow = { id: variable.id, name: variable.name, indent: 1, type: "data", baseline: null, target: null };
						subRow.cols = cols.map(function(col) {
							try { return getValue(result[col.id].values[variable.id]); }
							catch (e) {}
						});

						rows.push(subRow);

						variable.partition1.forEach(function(p1) {
							subRow.hasChildren = true;

							var subSubRow = { id: makeUUID(), parentId: variable.id, name: p1.name, indent: 2, type: "data", baseline: null, target: null };
							subSubRow.cols = cols.map(function(col) {
								try { return getValue(result[col.id].values[variable.id][p1.id]); }
								catch (e) {}
							});

							rows.push(subSubRow);

							variable.partition2.forEach(function(p2) {
								subSubRow.hasChildren = true;
								
								rows.push({
									id: makeUUID(), parentId: subSubRow.id, gParentId: subRow.id, name: p2.name, indent: 3, type: "data", baseline: null, target: null,
									cols: cols.map(function(col) {
										try { return getValue(result[col.id].values[variable.id][p1.id][p2.id]); }
										catch (e) {}
									})
								});
							});
						});
					});
				});
			});

			return rows;
		};

		var computeProjectReporting = function(allInputs, query, indicatorsById) {
			var cols = getColumns(query), result = {};

			query.project.dataCollection.forEach(function(form) {
				// Take all inputs that match our form.
				var inputs = allInputs.filter(function(input) { return input.form === form.id; });

				// Regroup them by the requested groupBy
				var regrouped = Input.aggregate(inputs, form, query.groupBy, query.project.inputsGroups);

				// For each regrouped input, compute the indicators values.
				for (var regroupKey in regrouped) {
					// Create a hash to receive the final results if it's not done yet.
					if (!result[regroupKey])
						result[regroupKey] = {values: {}, compute: {}};

					var input = regrouped[regroupKey];

					// Copy raw data into final result.
					// we use guids across forms so no collision check is needed.
					for (var rawId in input.values)
						result[regroupKey].values[rawId] = input.values[rawId];

					// Compute indicators and write them in the final result.
					form.fields.forEach(function(field) {
						
						// check if this indicator was already computed by another form.
						if (result[regroupKey].compute[field.indicatorId])
							result[regroupKey].compute[field.indicatorId] = 'FORM_CONFLICT';

						else {
							var indicatorValue;

							if (field.type === 'zero')
								indicatorValue = 0;
							else if (field.type === 'raw')
								indicatorValue = input.extractRawValue(field.rawId, field.filter);
							else if (field.type === 'formula') {
								var formula = indicatorsById[field.indicatorId].formulas[field.formulaId],
									localScope = {};

								for (var key in field.parameters) {
									if (field.parameters[key].type === 'zero')
										localScope[key] = 0;
									else if (field.parameters[key].type === 'raw')
										localScope[key] = input.extractRawValue(field.parameters[key].rawId, field.parameters[key].filter);
									else
										throw new Error('Invalid subfield type.');
								}

								try { indicatorValue = Parser.evaluate(formula.expression, localScope); }
								catch (e) { console.log('failed to evaluate', formula.expression, 'against', JSON.stringify(localScope)); }
							}
							else
								throw new Error('Invalid field type.');

							result[regroupKey].compute[field.indicatorId] = indicatorValue;
						}
					});
				}
			});

			return {
				cols: cols,
				indicatorRows: formatLogFrameReporting(query.project, result, cols, indicatorsById),
				rawDataRows: formatRawDataReporting(query.project, result, cols)
			};
		};

		var computeIndicatorReporting = function(inputs, query, indicatorById) {
			var rows = [];

			query.projects.forEach(function(project) {
				var projectInputs     = inputs.filter(function(input) { return input.project === project._id; }),
					projectQuery      = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy},
					projectResult     = computeProjectReporting(projectInputs, projectQuery, indicatorById);

				// override id and name
				var row = projectResult.indicatorRows.find(function(row) { return row.id === query.indicator._id; });
				row.id = project._id;
				row.name = project.name;
				row.type = 'project'; // presentation hack, should not be here.
				rows.push(row);

				project.inputEntities.forEach(function(entity) {
					var entityInputs = projectInputs.filter(function(input) { return input.entity === entity.id; }),
						entityQuery  = {begin: query.begin, end: query.end, project: project, groupBy: query.groupBy, type: 'entity', id: entity.id},
						entityResult = computeProjectReporting(entityInputs, entityQuery, indicatorById);

					// override id and name
					var row = entityResult.indicatorRows.find(function(row) { return row.id === query.indicator._id; });
					row.id = entity.id;
					row.name = entity.name;
					row.type = 'entity'; // presentation hack, should not be here.
					rows.push(row);
				});
			});

			return { cols: getColumns(query), rows: rows };
		};

		/**
		 * Given a project, find a default start date that makes sense to compute statistics
		 * - project is older than one year => one year ago
		 * - project started less than a year ago => project start
		 * - project starts in the future => now
		 */
		var getDefaultStartDate = function(project) {
			var result = moment().subtract(1, 'year');
			if (project && result.isBefore(project.begin))
				result = moment(project.begin)
			return result.format('YYYY-MM-DD');
		};

		/**
		 * Given a project, find a default end date that makes sense to compute statistics
		 * In fact, this always return the current date.
		 */
		var getDefaultEndDate = function(project) {
			return moment().format('YYYY-MM-DD');
		};

		return {
			getColumns: getColumns,
			getDefaultStartDate: getDefaultStartDate,
			getDefaultEndDate: getDefaultEndDate,

			computeProjectReporting: computeProjectReporting,
			computeIndicatorReporting: computeIndicatorReporting,
		};
	})

	