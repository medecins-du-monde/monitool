"use strict";

angular

	// Define module
	.module(
		'monitool.services.reporting',
		[
			'monitool.services.models.input',
			'monitool.services.itertools'
		]
	)

	// TODO profiling this piece of code for perfs could not hurt.
	// we will see how bad if performs on the wild.
	.service('mtReporting', function($q, Input, itertools) {

		/**
		 * This takes a mode and an array of values.
		 * mode is none, sum, average, highest, lowest, last
		 */
		this._aggregateValues = function(mode, values) {
			// if there is an error value in the array we need to aggregate, pass it up.
			var foundError = values.find(function(value) { return typeof value === 'string'; });
			if (foundError)
				return foundError;

			switch (mode) {
				case "none":
					return values.length == 1 ? values[0] : 'CANNOT_AGGREGATE';

				case "sum":
					return values.reduce(function(a, b) { return a + b; });

				case "average":
					return values.reduce(function(a, b, index, arr) { return a + b / arr.length; }, 0);

				case "highest":
					return values.reduce(function(a, b) { return a > b ? a : b; });

				case "lowest":
					return values.reduce(function(a, b) { return a > b ? b : a; });

				case "last":
					return values[values.length - 1];

				default:
					throw new Error('Invalid mode')
			}
		};

		/**
		 * Given a list of inputs of the same form, aggregate them, using the time or geo mode.
		 * mode is geoAgg or timeAgg
		 */
		this._groupInputLayer = function(mode, inputs, form) {
			// speed optim
			if (inputs.length === 0)
				return Input.makeFake(form);

			if (inputs.length === 1)
				return inputs[0];

			if (mode === 'timeAgg')
				inputs.sort(function(a, b) { return a.period < b.period ? -1 : 1; }); // sort inputs by date.
			else if (mode === 'geoAgg')
				inputs.sort(function(a, b) { return a.entity < b.entity ? -1 : 1; }); // sort inputs by entity.
			else
				throw new Error('Invalid mode.');

			var newInput = Input.makeFake(form);

			form.elements.forEach(function(element) {
				var elementMode = element[mode], values;

				if (element.partitions.length === 0) {
					values = inputs.map(function(input) { return input.values[element.id]['']; }); // if a field is not filled we assume 0
					newInput.values[element.id] = {'': this._aggregateValues(elementMode, values)};
				}
				else {
					itertools.product(element.partitions).map(function(list) {
						return list.pluck('id').sort().join('.');
					}).forEach(function(partition) {
						values = inputs.map(function(input) { return input.values[element.id][partition]; }); // if a field is not filled we assume 0
						newInput.values[element.id][partition] = this._aggregateValues(elementMode, values);
					}, this);
				}
			}, this);

			return newInput;
		};

		/**
		 * Given a project, and a list of inputs (of mixed forms)
		 * Generate a hash containing the aggregated data, with all possible partition sums
		 */
		this._groupInputs = function(project, inputs) {
			// we build {form: {location: [Input(), Input(), Input()]}}
			var inputsByFormEntity = {},
				numInputs = inputs.length;

			for (var inputId = 0; inputId < numInputs; ++inputId) {
				var input = inputs[inputId]

				if (inputsByFormEntity[input.form] === undefined)
					inputsByFormEntity[input.form] = {};
				if (inputsByFormEntity[input.form][input.entity] === undefined)
					inputsByFormEntity[input.form][input.entity] = [];
				
				inputsByFormEntity[input.form][input.entity].push(input);
			}

			// group layer by layer (starting with the deepest one).
			var result = new Input({type: "input", project: project._id, values: {}});

			for (var formId in inputsByFormEntity) {
				var form = project.forms.find(function(f) { return f.id === formId; });

				// group by time first, and then by geo.
				for (var entityId in inputsByFormEntity[formId])
					inputsByFormEntity[formId][entityId] = this._groupInputLayer('timeAgg', inputsByFormEntity[formId][entityId], form);

				inputsByFormEntity[formId] = Object.keys(inputsByFormEntity[formId]).map(function(key) { return inputsByFormEntity[formId][key]; }); // Object.values...
				var formResult = this._groupInputLayer('geoAgg', inputsByFormEntity[formId], form); // group them.

				// Copy raw data into final result.
				// we use guids across forms so no collision check is needed.
				// var allValues = formResult.computeSums(); // This line compute all possible sums among partitions in the activity data.
				for (var rawId in formResult.values)
					result.values[rawId] = formResult.values[rawId];
			}

			return result;
		};

		/**
		 * Given a hash containing activity data, an indicator, and it's metadata from the project,
		 * compute the indicator's value.
		 */
		this._computeIndicatorValue = function(activityData, indicator, indicatorMeta) {
			// if the indicator has to be computed with a formula.
			if (indicatorMeta.formula) {
				// Retrieve the formula parameters from activity reporting.
				var localScope = {};

				for (var key in indicatorMeta.parameters) {
					var parameter = indicatorMeta.parameters[key],
						numFilters = parameter.filter.length;

					if (numFilters == 0)
						localScope[key] = activityData[parameter.variable][''];
					else {
						localScope[key] = 0;
						for (var filterId = 0; filterId < numFilters; ++filterId) {
							var accItem = activityData[parameter.variable][parameter.filter[filterId]];
							if (typeof accItem !== "number")
								return accItem;

							localScope[key] += accItem;
						}
					}
				}

				// and compute the result.
				var formula = indicator.formulas[indicatorMeta.formula];
				try {
					return Parser.evaluate(formula.expression, localScope);
				}
				catch (e) {
					return 'INVALID_FORMULA';
				}
			}
			// if the indicator can be directly taken from the activity report.
			else if (indicatorMeta.variable) {
				// just extract the value.
				var numFilters = indicatorMeta.filter.length;

				if (numFilters == 0)
					return activityData[indicatorMeta.variable][''];
				else {
					var accumulator = 0;
					for (var filterId = 0; filterId < numFilters; ++filterId) {
						var accumulatorItem = activityData[indicatorMeta.variable][indicatorMeta.filter[filterId]];
						if (typeof accumulatorItem !== "number")
							return accumulatorItem;

						accumulator += accumulatorItem;
					}
					return accumulator;
				}
			}
			// There is nothing. We don't know how to compute.
			else
				return 'MISSING_DEFINITION';
		}


		/**
		 * This function accepts a list of groupBy and should be able to build any pivot table.
		 * 
		 * project  = Project(id, name, forms)
		 * inputs   = [Input(), Input()]
		 * groupBys = ['entity', 'month']
		 * => {entityId: {2010-01: {variableId: 23, variableId2: 45}}}
		 */
		this.computeReporting = function(project, inputs, groupBys, indicatorsById) {

			// there is no more group by => we can aggregate all inputs left in a single hash.
			if (groupBys.length === 0) {
				// Group all inputs that remain at the leaf into a hash with all possible sums.
				var result = this._groupInputs(project, inputs).computeSums();

				// if indicator definitions are available, compute them.
				for (var indicatorId in project.indicators) {
					if (indicatorsById && indicatorsById[indicatorId]) {
						var indicator = indicatorsById[indicatorId],
							indicatorMeta = project.indicators[indicatorId];

						result[indicatorId] = this._computeIndicatorValue(result, indicator, indicatorMeta);
					}
				}

				return result;
			}
			// we need to split our inputs into hashes
			else {
				// split group bys into head and tail.
				var currentGroupBy = groupBys[0], otherGroupBys = groupBys.slice(1);

				// group inputs in a hashmap.
				var groups = {},
					numInputs = inputs.length;

				for (var inputId = 0; inputId < numInputs; ++inputId) {
					var input = inputs[inputId],
						aggregationKeys = input.getAggregationKeys(currentGroupBy, project.groups),
						numAggregationKeys = aggregationKeys.length;

					for (var j = 0; j < numAggregationKeys; ++j) {
						var aggKey = aggregationKeys[j];
						if (groups[aggKey] == undefined)
							groups[aggKey] = [];

						groups[aggKey].push(input)
					}
				}

				for (var aggKey in groups)
					groups[aggKey] = this.computeReporting(project, groups[aggKey], otherGroupBys, indicatorsById);
				
				return groups;
			}
		};

		this.getColumns = function(groupBy, begin, end, entityId, project) {
			var type;
			if (!entityId)
				type = 'project';
			else if (project.groups.find(function(g) { return g.id === entityId }))
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
					return project.entities.concat([{id:'total',name:'Total'}]);
				else if (type === 'entity')
					return project.entities.filter(function(e) { return e.id === entityId })
												.concat([{id:'total',name:'Total'}]);
				else  if (type === 'group') {
					var group = project.groups.find(function(g) { return g.id === entityId });
					return project.entities.filter(function(e) { return group.members.indexOf(e.id) !== -1 })
												.concat([{id:'total',name:'Total'}]);
				}
			}
			else if (groupBy === 'group') {
				if (type === 'project')
					return project.groups;
				else if (type === 'entity')
					return project.groups.filter(function(g) { return g.members.indexOf(entityId) !== -1 });
				else if (type === 'group')
					return project.groups.filter(function(g) { return g.id === entityId });
			}
			else
				throw new Error('Invalid groupBy: ' + groupBy)
		};

		/**
		 * Helper function for
		 * - {projectId}/reporting
		 * - {projectId}/
		 */
		this.computeProjectReporting = function(projectInputs, project, groupBy, indicatorsById) {
			return this.computeReporting(project, projectInputs, [groupBy], indicatorsById);
		};

		this.computeProjectDetailedReporting = function(projectInputs, project, groupBy, indicatorsById) {
			var byEntity  = this.computeReporting(project, projectInputs, ['entity', groupBy], indicatorsById),
				byGroup   = this.computeReporting(project, projectInputs, ['group', groupBy], indicatorsById);

			var result = {};
			Object.keys(byEntity).forEach(function(key) { result[key] = byEntity[key]; });
			Object.keys(byGroup).forEach(function(key) { result[key] = byGroup[key]; });
			result[project._id] = byEntity.total;

			return result;
		};

		this.computeIndicatorReporting = function(inputs, projects, indicator, groupBy) {
			var indicatorsById = {};
			indicatorsById[indicator._id] = indicator;

			var result = {};
			projects.forEach(function(project) {
				var indicatorMeta = project.indicators[indicator._id],
					projectInputs = inputs.filter(function(input) { return input.project === project._id; });

				var reporting = this.computeReporting(project, projectInputs, [groupBy], indicatorsById);
				
				result[project._id] = {};
				for (var regroupKey in reporting)
					result[project._id][regroupKey] = reporting[regroupKey][indicator._id];
			}, this);

			return result;
		};
	})
