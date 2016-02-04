"use strict";

angular
	
	// Define module
	.module(
		'monitool.services.models.input',
		[
			'ngResource',
			'monitool.services.itertools'
		]
	)

	// Define Input factory
	.factory('Input', function($resource, $q, itertools) {

		// this has nothing to do on the root scope.
		// => move it to a service and factorize with the similiar function in mtReporting
		var _getPeriods = function(form, project) {
			var periods;
			if (['year', 'quarter', 'month', 'week', 'day'].indexOf(form.periodicity) !== -1) {
				var period = form.periodicity === 'week' ? 'isoWeek' : form.periodicity;

				var current = moment(form.useProjectStart ? project.begin : form.start).startOf(period),
					end     = moment(form.useProjectEnd ? project.end : project.end).endOf(period);

				if (end.isAfter()) // do not allow to go in the future
					end = moment();

				periods = [];
				while (current.isBefore(end)) {
					periods.push(current.clone());
					current.add(1, form.periodicity);
				}
			}
			else if (form.periodicity === 'planned') {
				periods = form.intermediaryDates.map(function(period) {
					return moment(period);
				});
				periods.unshift(moment(form.start));
				periods.push(moment(form.end));
			}
			else
				throw new Error(form.periodicity + ' is not a valid periodicity');

			return periods;
		};

		// Create $resource
		var Input = $resource('/resources/input/:id', { id: "@_id" }, { save: { method: "PUT" }});

		/**
		 * Factory with default value
		 */
		Input.makeNew = function(projectId, form, period, entityId) {
			var input = new Input({
				_id: [projectId, entityId, form.id, period].join(':'),
				type: "input",
				project: projectId,
				form: form.id,
				period: period,
				entity: entityId,
				values: {},
			});

			input.sanitize(form);
			return input;
		};

		/**
		 * Factory with default value
		 */
		Input.makeFake = function(form) {
			var input = new Input({form: form.id, values: {}});
			input.sanitize(form);
			return input;
		};

		Input.fetchProjectStatus = function(project) {
			return Input.query({mode: 'project_input_ids', projectId: project._id}).$promise.then(function(inputsDone) {
				var prj = {};

				inputsDone.forEach(function(inputId) {
					var splitted      = inputId.split(':'),
						projectId     = splitted[0],
						inputEntityId = splitted[1],
						formId        = splitted[2],
						strPeriod     = splitted[3];

					prj[formId] = prj[formId] || {};

					if (inputEntityId === 'none')
						prj[formId][strPeriod] = 'outofschedule';
					else {
						prj[formId][strPeriod] = prj[formId][strPeriod] || {};
						prj[formId][strPeriod][inputEntityId] = 'outofschedule';
					}
				});

				project.forms.forEach(function(form) {
					prj[form.id] = prj[form.id] || {};

					_getPeriods(form, project).forEach(function(period) {
						var strPeriod = period.format('YYYY-MM-DD');

						if (form.collect === 'entity') {
							prj[form.id][strPeriod] = prj[form.id][strPeriod] || {}

							project.entities.forEach(function(inputEntity) {
								if (prj[form.id][strPeriod][inputEntity.id] == 'outofschedule')
									prj[form.id][strPeriod][inputEntity.id] = 'done';
								else
									prj[form.id][strPeriod][inputEntity.id] = form.active ? 'expected' : 'inactive';
							});
						}
						else if (form.collect === 'project') {
							if (prj[form.id][strPeriod] == 'outofschedule')
								prj[form.id][strPeriod] = 'done';
							else
								prj[form.id][strPeriod] = form.active ? 'expected' : 'inactive';
						}
						else
							throw new Error('Invalid form.collect value.');
					});
				});

				return prj;
			});
		};

		Input.fetchLasts = function(projectId, entityId, form, period) {
			return Input.query({
				mode: "current+last",
				projectId: projectId,
				entityId: entityId,
				formId: form.id,
				period: period
			}).$promise.then(function(result) {
				result.forEach(function(input) { input.sanitize(form); });

				var currentInputId = [projectId, entityId, form.id, period].join(':');

				// both where found
				if (result.length === 2) 
					return { current: result[0], previous: result[1], isNew: false };

				// only the current one was found
				else if (result.length === 1 && result[0]._id === currentInputId) 
					return { current: result[0], previous: null, isNew: false };

				// the current one was not found (and we may or not have found the previous one).
				return {
					current: Input.makeNew(projectId, form, period, entityId),
					previous: result.length ? result[0] : null,
					isNew: true
				};
			});
		};


		Input.fetchForProject = function(project) {
			return this.fetchForProjects([project]);
		};

		Input.fetchForProjects = function(projects) {
			// Index forms by their uuid.
			var formsById = {};
			projects.forEach(function(project) {
				project.forms.forEach(function(form) {
					formsById[form.id] = form;
				});
			});

			// Buid promises for each project's inputs.
			var promises = projects.map(function(project) {
				return Input.query({mode: "project_inputs", projectId: project._id}).$promise;
			});

			return $q.all(promises).then(function(inputs) {
				// Reduce the inputs array.
				inputs = inputs.reduce(function(m, i) {
					return m.concat(i);
				}, []);

				// remove inputs that have no matching form
				inputs = inputs.filter(function(input) {
					if (!formsById[input.form])
						console.log('Dropping input: ', input._id);

					return !!formsById[input.form];
				});

				// ask each input to sanitize itself with the relevant form.
				inputs.forEach(function(input) {
					input.sanitize(formsById[input.form]);
				});

				return inputs;
			});
		};

		Input.aggregate = function(inputs, form, groupBy, projectGroups) {
			var groupedInputs = {};

			// Transform input list to {"2010-Q1": { "someEntityId": [Input('2010-02'), Input('2010-01'), ...], ... }}
			inputs.forEach(function(input) {
				input.getAggregationKeys(groupBy, projectGroups).forEach(function(key) {
					!groupedInputs[key] && (groupedInputs[key] = {});
					!groupedInputs[key][input.entity] && (groupedInputs[key][input.entity] = []);
					groupedInputs[key][input.entity].push(input);
				});
			});

			// Transform to {"2010-Q1": [[Input('2010-01'), Input('2010-02'), ...], ...]}
			for (var groupKey in groupedInputs) {
				for (var entityId in groupedInputs[groupKey]) {
					// sort by date so that "last" aggregation mode works
					groupedInputs[groupKey][entityId].sort(function(a, b) { return a < b ? -1 : 1; });
				}

				// transform into array
				groupedInputs[groupKey] = Object.keys(groupedInputs[groupKey]).map(function(k) { return groupedInputs[groupKey][k]; });
			}

			// Now we need to aggregate by levels. We will obtain {"2010-Q1": Input()}
			for (var key in groupedInputs) {
				// aggregate by time first.
				groupedInputs[key].forEach(function(sameEntityInputs, index) {
					groupedInputs[key][index] = _groupInputs('timeAgg', sameEntityInputs, form);
				});

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

			var newValues = {},
				sums = this.computeSums();

			var numSections = form.sections.length;
			for (var i = 0; i < numSections; ++i) {
				var elements = form.sections[i].elements,
					numElements = elements.length;

				for (var j = 0; j < numElements; ++j) {
					var element = elements[j];

					if (element.partitions.length === 0)
						newValues[element.id] = sums[element.id] || 0;
					else {
						var partitions = itertools.product(element.partitions),
							numPartitions = partitions.length;

						for (var k = 0; k < numPartitions; ++k) {
							var key = element.id + '.' + partitions[k].pluck('id').sort().join('.');

							newValues[key] = sums[key] || 0;
						}
					}
				}
			}

			this.values = newValues;
		};


		/**
		 * Given a input.value hash, compute all possible sums.
		 * This is used for the agg data stats.
		 */
		Input.prototype.computeSums = function() {
			var result = {};

			for (var key in this.values) {
				var parts = key.split('.'),
					variableId = parts.shift();

				// now we need to create a key for each subset of the partition.
				var numElements = parts.length,
					numSubsets = Math.pow(2, parts.length);

				for (var subsetIndex = 0; subsetIndex < numSubsets; ++subsetIndex) {
					// Build subset key
					var subsetKey = variableId;
					for (var partitionIndex = 0; partitionIndex < numElements; ++partitionIndex) {
						if (subsetIndex & (1 << partitionIndex))
							subsetKey += '.' + parts[partitionIndex];
					}

					result[subsetKey] = result[subsetKey] || 0; // initialize if needed

					// handle CANNOT_AGGREGATE.
					if (typeof this.values[key] !== 'number') {
						result[subsetKey] = this.values[key];
						break;
					}

					result[subsetKey] += this.values[key];
				}
			}

			return result;
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
					// FIXME this test appears to be always false
					if (this.entity !== 'none' && projectGroups)
						return projectGroups.filter(function(group) {
							return group.members.indexOf(this.entity) !== -1;
						}, this).pluck('id')
					else
						return [];

				case 'project':
					return ['total', this.project];
			}
		};

		return Input;
	});
