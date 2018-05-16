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

import angular from 'angular';
import axios from 'axios';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

export default class Input {

	static async fetchFormStatus(project, formId) {
		const response = await axios.get(
			'/api/resources/input',
			{params: {mode: 'ids_by_form', projectId: project._id, formId: formId}}
		);

		const inputsDone = response.data;
		const form = project.forms.find(f => f.id === formId);
		var prj = {};

		inputsDone.forEach(inputId => {
			var splitted      = inputId.split(':'),
				inputEntityId = splitted[4],
				strPeriod     = splitted[5];

			prj[strPeriod] = prj[strPeriod] || {};
			prj[strPeriod][inputEntityId] = 'outofschedule';
		});

		form.entities.forEach(entityId => {
			var strPeriods;
			if (form.periodicity === 'free')
				strPeriods = Object.keys(prj);
			else {
				const entity = project.entities.find(entity => entity.id == entityId);
				const [start, end] = [
					[project.start, entity.start, form.start].filter(a => a).sort().pop(),
					[project.end, entity.end, form.end, new Date().toISOString().substring(0, 10)].filter(a => a).sort().shift()
				];

				strPeriods = Array
					.from(
						timeSlotRange(
							TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), form.periodicity),
							TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), form.periodicity)
						)
					)
					.map(ts => ts.value);
			}

			strPeriods.forEach(strPeriod => {
				prj[strPeriod] = prj[strPeriod] || {};

				if (prj[strPeriod][entityId] == 'outofschedule')
					prj[strPeriod][entityId] = 'done';
				else
					prj[strPeriod][entityId] = 'expected';
			});
		});

		// Sort periods alphabetically
		var periods = Object.keys(prj);
		periods.sort();

		var newObj = {};
		periods.forEach(period => newObj[period] = prj[period])
		prj = newObj;

		return prj;
	}

	static async fetchLasts(project, entityId, formId, period) {
		const response = await axios.get(
			'/api/resources/input',
			{
				params: {
					mode: "current+last",
					projectId: project._id,
					entityId: entityId,
					formId: formId,
					period: period
				}
			}
		);

		const result = response.data.map(i => new Input(i));

		var currentInputId = ['input', project._id, formId, entityId, period].join(':');

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

		const form = project.forms.find(f => f.id === formId);
		form.elements.forEach(element => {
			const numFields = element.partitions.reduce((m, p) => m * p.elements.length, 1);
			current.values[element.id] = new Array(numFields);
			current.values[element.id].fill(0);
		});

		// the current one was not found (and we may or not have found the previous one).
		return {
			current: current,
			previous: result.length ? result[0] : null,
			isNew: true
		};
	}


	constructor(data=null) {
		Object.assign(this, data);
	}

	async save() {
		const response = await axios.put(
			'/api/resources/input/' + this._id,
			JSON.parse(angular.toJson(this))
		);

		Object.assign(this, response.data);
	}

	async delete() {
		return axios.delete('/api/resources/input/' + this._id);
	}

}

