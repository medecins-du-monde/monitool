/*!
 * This file is part of Monitool.
 *
 * Monitool is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Monitool is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Monitool. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

angular
	
	.module('monitool.services.models.input', ['ngResource', 'monitool.services.utils.input-slots'])
	.factory('Input', function($resource, $q, InputSlots) {

		// Create $resource
		var Input = $resource('/resources/input/:id', { id: "@_id" }, { save: { method: "PUT" }});

		Input.fetchFormStatus = function(project, formId) {
			var form = project.forms.find(function(f) {return f.id == formId; });

			return Input.query({mode: 'ids_by_form', projectId: project._id, formId: formId}).$promise.then(function(inputsDone) {
				var prj = {};

				inputsDone.forEach(function(inputId) {
					var splitted      = inputId.split(':'),
						projectId     = splitted[0],
						inputEntityId = splitted[1],
						formId        = splitted[2],
						strPeriod     = splitted[3];

					prj[strPeriod] = prj[strPeriod] || {};
					prj[strPeriod][inputEntityId] = 'outofschedule';
				});

				if (form.periodicity === 'free') {
					// we expect all dates and centers where we have @ least one input
					if (form.collect === 'some_entity') {
						for (var strPeriod in prj) {
							form.entities.forEach(function(entityId) {
								if (prj[strPeriod][entityId] == 'outofschedule')
									prj[strPeriod][entityId] = 'done';
								else
									prj[strPeriod][entityId] = 'expected';
							});
						}
					}
					else if (form.collect === 'entity') {
						for (var strPeriod in prj) {
							project.entities.forEach(function(entity) {
								if (prj[strPeriod][entity.id] == 'outofschedule')
									prj[strPeriod][entity.id] = 'done';
								else
									prj[strPeriod][entity.id] = 'expected';
							});
						}
					}
					else if (form.collect === 'project') {
						for (var strPeriod in prj) {
							if (prj[strPeriod].none == 'outofschedule')
								prj[strPeriod].none = 'done';
							else
								prj[strPeriod].none = 'expected';
						}
					}
					else
						throw new Error('Invalid form.collect value.');
				}
				else {
					// we expect only the dates that are specified with the periodicity.
					if (form.collect === 'some_entity')
						form.entities.forEach(function(entityId) {
							var inputEntity = project.entities.find(function(entity) { return entity.id == entityId; });

							InputSlots.getList(project, inputEntity, form).forEach(function(strPeriod) {
								prj[strPeriod] = prj[strPeriod] || {}

								if (prj[strPeriod][inputEntity.id] == 'outofschedule')
									prj[strPeriod][inputEntity.id] = 'done';
								else
									prj[strPeriod][inputEntity.id] = 'expected';
							});
						});
					
					else if (form.collect === 'entity')
						project.entities.forEach(function(inputEntity) {
							InputSlots.getList(project, inputEntity, form).forEach(function(strPeriod) {
								prj[strPeriod] = prj[strPeriod] || {}

								if (prj[strPeriod][inputEntity.id] == 'outofschedule')
									prj[strPeriod][inputEntity.id] = 'done';
								else
									prj[strPeriod][inputEntity.id] = 'expected';
							});
						});
					
					else if (form.collect === 'project')
						InputSlots.getList(project, null, form).forEach(function(strPeriod) {
							prj[strPeriod] = prj[strPeriod] || {}

							if (prj[strPeriod].none == 'outofschedule')
								prj[strPeriod].none = 'done';
							else
								prj[strPeriod].none = 'expected';
						});
					
					else
						throw new Error('Invalid form.collect value.');
				}

				// Sort periods alphabetically
				var periods = Object.keys(prj);
				periods.sort();

				var newObj = {};
				periods.forEach(function(period) { newObj[period] = prj[period]; })
				prj = newObj;

				return prj;
			});
		};

		Input.fetchLasts = function(project, entityId, formId, period) {
			var form = project.forms.find(function(f) { return f.id == formId; });

			return Input.query({
				mode: "current+last",
				projectId: project._id,
				entityId: entityId,
				formId: formId,
				period: period
			}).$promise.then(function(result) {
				var currentInputId = [project._id, entityId, formId, period].join(':');

				// both where found
				if (result.length === 2) 
					return { current: result[0], previous: result[1], isNew: false };

				// only the current one was found
				else if (result.length === 1 && result[0]._id === currentInputId) 
					return { current: result[0], previous: null, isNew: false };

				var current = new Input({
					_id: currentInputId, type: "input",
					project: project._id, form: formId, period: period, entity: entityId,
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



		return Input;
	});
