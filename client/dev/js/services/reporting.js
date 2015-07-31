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

		var computeProjectActivityReporting = function(allInputs, project, groupBy) {
			var result = {};

			// Compute raw data.
			project.dataCollection.forEach(function(form) {
				// Take all inputs that match our form.
				var inputs = allInputs.filter(function(input) { return input.form === form.id; });

				// Regroup them by the requested groupBy
				var regrouped = Input.aggregate(inputs, form, groupBy, project.inputGroups);

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

		return {
			getColumns: getColumns,
			computeProjectActivityReporting: computeProjectActivityReporting,
			computeProjectIndicatorReporting: computeProjectIndicatorReporting,
		};
	})

	