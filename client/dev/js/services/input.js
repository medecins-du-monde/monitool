"use strict";

angular.module('monitool.services.models.input', [])
	.factory('Input', function($resource) {

		/**
		 * This takes a mode and an array of values.
		 * mode is none, sum, average, highest, lowest, last
		 */
		var _aggregateValues = function(mode, values) {
			// filter out unanswered questions
			values = values.filter(function(v) { return v !== undefined && v !== null; });

			// if nothing remains, we can't aggregate.
			if (values.length == 0)
				return undefined;

			switch (element[mode]) {
				case "none":
					return values.length == 1 ? values[0] : undefined;

				case "sum":
					return values.reduce(function(a, b) { return a + b; });

				case "average":
					return values.reduce(function(a, b, index, arr) { return a + b / arr.length; }, 0)

				case "highest":
					return values.reduce(function(a, b) { return a > b ? a : b; });

				case "lowest":
					return values.reduce(function(a, b) { return a > b ? b : a; });

				case "last":
					return values[values.length - 1];
			}
		};


		/**
		 * mode is geoAgg or timeAgg
		 */
		var _groupInputs = function(mode, inputs, form) {
			var newInput = Input.makeNew();

			form.rawData.forEach(function(section) {
				section.elements.forEach(function(element) {
					var mode = element[mode], values;

					// simple elements.
					if (!element.partition1.length && !element.partition2.length) {
						values = inputs.map(function(input) { return input.values[element.id]; });
						newInput.values[element.id] = _aggregateValues(mode, values);
					}
					// one partition.
					else if (element.partition1.length && !element.partition2.length) {
						newInput.values[element.id] = {}

						// aggregate sums
						values = inputs.map(function(input) { return input.values[element.id].sum; });
						newInput.values[element.id].sum = _aggregateValues(mode, values);

						// aggregate partitions
						element.partition1.forEach(function(p1) {
							values = inputs.map(function(input) { return input.values[element.id][p1.id]; });
							newInput.values[element.id][p1.id] = _aggregateValues(mode, values);
						})
					}
					// two partitions.
					else if (element.partition1.length && element.partition2.length) {
						newInput.values[element.id] = {}

						// aggregate sums
						values = inputs.map(function(input) { return input.values[element.id].sum; });
						newInput.values[element.id].sum = _aggregateValues(mode, values);

						// aggregate partitions
						element.partition1.forEach(function(p1) {
							values = inputs.map(function(input) { return input.values[element.id][p1.id].sum; });
							newInput.values[element.id][p1.id].sum = _aggregateValues(mode, values);

							element.partition2.forEach(function(p2) {
								values = inputs.map(function(input) { return input.values[element.id][p1.id][p2.id]; });
								newInput.values[element.id][p1.id][p2.id] = _aggregateValues(mode, values);
							});
						});
					}
				});
			});

			return newInput;
		};






		// Create $resource
		var Input = $resource( '/input/:id', { id: "@_id" }, { save: { method: "PUT" }});

		/**
		 * Factory with default value
		 */
		Input.makeNew = function() {
			return new Input({
				type: "input",
				values: {}
			});
		};

		/**
		 * Retrieve from server all inputs that match (between 2 dates)
		 * - a given project
		 * - a given indicator
		 * - a group or an entity
		 */
		Input.fetchFromQuery = function(query) {
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

			return Input.query(options).$promise.then(function(inputs) {
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

		Input.aggregate = function(inputs, form, groupBy, projectGroups) {
			var groupedInputs = {};

			// Transform input list to 
			//	 {
			//	 	"2010-Q1": { "someEntityId": [Input('2010-02'), Input('2010-01'), ...], ... }
			//	 }
			inputs.forEach(function(input) {
				input.getAggregationKeys(groupBy, projectGroups).forEach(function(key) {
					!groupedInputs[key] && (groupedInputs[key] = {});
					!groupedInputs[key][input.entity] && (groupedInputs[key][input.entity] = []);
					groupedInputs[key][input.entity].push(input);
				});
			});


			// Transform to 
			//	 {
			//	 	"2010-Q1": [[Input('2010-01'), Input('2010-02'), ...], ...]
			//	 }
			for (var groupKey in groupedInputs) {
				for (var entityId in groupedInputs[groupKey]) {
					console.log(groupedInputs[groupKey][entityId])
					// sort by date so that "last" aggregation mode works
					groupedInputs[groupKey][entityId].sort(function(a, b) { return a < b ? -1 : 1; });
				}
				// transform into array
				groupedInputs[groupKey] = Object.keys(groupedInputs[groupKey]).map(function(k) { return groupedInputs[groupKey][k]; });
			}


			// Now we need to aggregate by levels. We will obtain
			// 	{
			// 		"2010-Q1": Input()
			// 	}
			for (var key in groupedInputs) {
				// aggregate by time first.
				for (var entityId in groupedInputs[key])
					groupedInputs[key][entityId] = _groupInputs('timeAgg', groupedInputs[key][entityId], form);

				// and then by location
				groupedInputs[key] = _groupInputs('geoAgg', groupedInputs[key], form);
			}

			return groupedInputs;
		};


		/**
		 * Change values to match a given form
		 */
		Input.prototype.sanitize = function(form) {
			if (this.form !== form.id)
				throw new Error('Invalid form');

			var elementsById = {};
			for (var i = 0, numSections = form.rawData.length; i < numSections; ++i)
				for (var j = 0, numElements = form.rawData[i].elements.length; j < numElements; ++j)
					elementsById[form.rawData[i].elements[j].id] = form.rawData[i].elements[j];

			for (var elementId in values) {
				if (elementId !== 'count') {
					var element = elementsById[elementId],
						value   = values[elementId];

					if (!element)
						delete values[elementId];

					var numPartitions1 = element.partition1.length,
						numPartitions2 = element.partition2.length,
						p1, p2;
					
					if (numPartitions1 && numPartitions2) {
						if (typeof value !== 'object')
							delete values[elementId];

						else for (p1 in value) {
							// if the partition does not exists or is not a hashmap
							if (!element.partition1.find(function(p) { return p.id === p1; }) || typeof value[p1] !== 'object')
								delete value[p1];

							else for (p2 in value[p1])
								// if the partition does not exists or is not a number
								if (!element.partition2.find(function(p) { return p.id === p2; }) || typeof value[p1][p2] !== 'number')
									delete value[p1][p2];
						}
					}
					else if (numPartitions1) {
						if (typeof value !== 'object')
							delete values[elementId];

						else for (p1 in value)
							// if the partition does not exists or is not a number
							if (!element.partition1.find(function(p) { return p.id === p1; }) || typeof value[p1] !== 'number')
								delete value[p1];
					}
					else {
						if (typeof value !== "number")
							delete values[elementId];
					}
				}
			}
		};


		/**
		 * Given a rawId, and a filter, returns the appropriate sum
		 * If no filter is provided, assume the user want all partitions.
		 */
		Input.prototype.extractRawValue = function(rawId, filter) {
			result = 0;

			try {
				// we support not defining any filter for simple fields.
				if (!field.filter || !Array.isArray(field.filter) || field.filter.length == 0)
					result = raw[field.rawId];
				else
					field.filter.forEach(function(filterInstance) {
						var v = raw[field.rawId];
						if (Array.isArray(filterInstance))
							// filters can be as long as they want, which is not the case IRL
							filterInstance.forEach(function(f) { v = v[f]; });
						else
							// is the filter is not an array we assume that we can just get the data.
							v = v[filterInstance];

						// v may be undefined or null if the field was not filled.
						// we just ignore it in that case.
						if (typeof v == 'number')
							result += v;
					});
			}
			catch (e) {
				// input does not match form structure.
				// we can skip this whole indicator.
				return "FORM_CHANGED";
			}
		};



		/**
		 * Compute all aggregations keys this input should be included in
		 */
		Input.prototype.getAggregationKeys = function(aggregationType, projectGroups) {
			// annotate each input with keys that will later tell the sumBy function how to aggregate the data.
			var period = moment(this.period);

			switch (aggregationType) {
				case 'year':
					return ['total', period.format('YYYY')];

				case 'quarter':
					return ['total', period.format('YYYY-[Q]Q')];

				case 'month':
					return ['total', period.format('YYYY-MM')];

				case 'week':
					return ['total', period.format('YYYY-[W]WW')];

				case 'day':
					return ['total', period.format('YYYY-MM-DD')];

				case 'entity':
					return this.entity !== 'none' ? ['total', this.entity] : ['total'];

				case 'group':
					if (this.entity !== 'none' && projectGroups)
						return projectGroups.filter(function(group) {
							return group.members.indexOf(this.entity) !== -1;
						}).map(function(group) {
							return group.id;
						});
					else
						return [];

				case 'project':
					return ['total', this.project];
			}
		};

		return Input;
	});
