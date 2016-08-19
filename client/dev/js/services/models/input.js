"use strict";

angular
	
	.module('monitool.services.models.input', ['ngResource', 'monitool.services.utils.input-slots'])
	.factory('Input', function($resource, $q, InputSlots) {

		// Create $resource
		var Input = $resource('/resources/input/:id', { id: "@_id" }, { save: { method: "PUT" }});

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
					prj[formId][strPeriod] = prj[formId][strPeriod] || {};
					prj[formId][strPeriod][inputEntityId] = 'outofschedule';
				});

				project.forms.forEach(function(form) {
					prj[form.id] = prj[form.id] || {};

					if (form.periodicity === 'free') {
						// we expect all dates and centers where we have @ least one input
						if (form.collect === 'some_entity') {
							for (var strPeriod in prj[form.id]) {
								form.entities.forEach(function(entityId) {
									if (prj[form.id][strPeriod][entityId] == 'outofschedule')
										prj[form.id][strPeriod][entityId] = 'done';
									else
										prj[form.id][strPeriod][entityId] = 'expected';
								});
							}
						}
						else if (form.collect === 'entity') {
							for (var strPeriod in prj[form.id]) {
								project.entities.forEach(function(entity) {
									if (prj[form.id][strPeriod][entity.id] == 'outofschedule')
										prj[form.id][strPeriod][entity.id] = 'done';
									else
										prj[form.id][strPeriod][entity.id] = 'expected';
								});
							}
						}
						else if (form.collect === 'project') {
							for (var strPeriod in prj[form.id]) {
								if (prj[form.id][strPeriod].none == 'outofschedule')
									prj[form.id][strPeriod].none = 'done';
								else
									prj[form.id][strPeriod].none = 'expected';
							}
						}
						else
							throw new Error('Invalid form.collect value.');
					}
					else {
						// we expect only the dates that are specified with the periodicity.
						if (form.collect === 'some_entity') {
							form.entities.forEach(function(entityId) {
								var inputEntity = project.entities.find(function(entity) { return entity.id == entityId; });

								InputSlots.getListDate(project, inputEntity, form).forEach(function(period) {
									var strPeriod = period.format('YYYY-MM-DD');

									prj[form.id][strPeriod] = prj[form.id][strPeriod] || {}

									if (prj[form.id][strPeriod][inputEntity.id] == 'outofschedule')
										prj[form.id][strPeriod][inputEntity.id] = 'done';
									else
										prj[form.id][strPeriod][inputEntity.id] = 'expected';
								});
							});
						}
						else if (form.collect === 'entity')
							project.entities.forEach(function(inputEntity) {
								InputSlots.getListDate(project, inputEntity, form).forEach(function(period) {
									var strPeriod = period.format('YYYY-MM-DD');

									prj[form.id][strPeriod] = prj[form.id][strPeriod] || {}

									if (prj[form.id][strPeriod][inputEntity.id] == 'outofschedule')
										prj[form.id][strPeriod][inputEntity.id] = 'done';
									else
										prj[form.id][strPeriod][inputEntity.id] = 'expected';
								});
							});
						
						else if (form.collect === 'project')
							InputSlots.getListDate(project, null, form).forEach(function(period) {
								var strPeriod = period.format('YYYY-MM-DD');

								prj[form.id][strPeriod] = prj[form.id][strPeriod] || {}

								if (prj[form.id][strPeriod].none == 'outofschedule')
									prj[form.id][strPeriod].none = 'done';
								else
									prj[form.id][strPeriod].none = 'expected';
							});
						
						else
							throw new Error('Invalid form.collect value.');
					}
				});

				// Sort periods alphabetically
				project.forms.forEach(function(form) {
					var periods = Object.keys(prj[form.id]);
					periods.sort();

					var newObj = {};
					periods.forEach(function(period) { newObj[period] = prj[form.id][period]; })
					prj[form.id] = newObj;
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
				var currentInputId = [projectId, entityId, form.id, period].join(':');

				// both where found
				if (result.length === 2) 
					return { current: result[0], previous: result[1], isNew: false };

				// only the current one was found
				else if (result.length === 1 && result[0]._id === currentInputId) 
					return { current: result[0], previous: null, isNew: false };

				var current = new Input({
					_id: currentInputId, type: "input",
					project: projectId, form: form.id, period: period, entity: entityId,
					values: {}
				});

				form.elements.forEach(function(element) {
					var numFields = 1;
					element.partitions.forEach(function(partition) { numFields *= partition.elements.length; });
					
					current.values[element.id] = new Array(numFields);
					for (var i = 0; i < numFields; ++i)
						current.values[element.id][i] = 0;
				});

				// the current one was not found (and we may or not have found the previous one).
				return {current: current, previous: result.length ? result[0] : null, isNew: true};
			});
		};


		Input.fetchForProject = function(project) {
			return this.fetchForProjects([project]);
		};

		Input.fetchForProjects = function(projects) {
			// Index projects by uuid.
			var projectsById = {};
			projects.forEach(function(project) { projectsById[project._id] = project; });

			// Buid promises to fetch each project's inputs.
			var promises = projects.map(function(project) {
				return Input.query({mode: "project_inputs", projectId: project._id}).$promise;
			});

			// Fetch
			return $q.all(promises).then(function(inputs) {
				return inputs
					// Merge the inputs arrays into one long array.
					.reduce(function(m, i) { return m.concat(i); }, [])

					// remove inputs that are out of date.
					.filter(function(input) { return input.isOutOfSchedule(projectsById[input.project]); });
			});
		};

		Input.prototype.isOutOfSchedule = function(project) {
			if (project._id !== this.project)
				throw new Error();

			var form    = project.forms.find(function(f) { return f.id == this.form; }.bind(this)),
				entity  = project.entities.find(function(e) { return e.id == this.entity; }.bind(this));
			
			// an input needs to have an associated form.
			if (!form) {
				console.log("Dropping input:", this._id, '(no form)');
				return false;
			}

			// an input needs to be on one of the allowed entities (or none for project collection).
			if (form.collect == 'project' && this.entity !== 'none') {
				console.log("Dropping input:", this._id, '(not linked with project)');
				return false;
			}

			if (form.collect == 'some_entity' && (!entity || form.entities.indexOf(this.entity) === -1)) {
				console.log("Dropping input:", this._id, '(entity not in form)');
				return false;
			}

			if (form.collect == 'entity' && !entity) {
				console.log("Dropping input:", this._id, '(entity not in project)');
				return false;
			}

			var inputDate = moment.utc(this.period);

			// an input needs to be on the timeframe of the form and associated entity.
			if (form.periodicity !== 'free') {
				var begin = InputSlots.getFirstDate(project, entity, form),
					end   = InputSlots.getLastDate(project, entity, form);

				if (inputDate.isBefore(begin) || inputDate.isAfter(end)) {
					console.log("Dropping input:", this._id, '(input not in date range)');
					return false;
				}
			}

			// an input needs to be collected the first day of its period.
			if (form.periodicity !== 'free' && form.periodicity !== 'day') {
				var formPeriodicity = form.periodicity === 'week' ? 'isoWeek' : form.periodicity,
					wishedDate = inputDate.clone().startOf(formPeriodicity);

				if (!inputDate.isSame(wishedDate)) {
					console.log("Dropping input:", this._id, '(date not first day in period)');
					return false;
				}
			}

			return true;
		};

		return Input;
	});
