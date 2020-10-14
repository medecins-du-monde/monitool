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

	static async fetchDataSourceShortStatus(project) {
		const result = await Promise.all(project.forms.map(async dataSource => {
			const dsResult = Object
				.values(await this.fetchFormStatus(project, dataSource.id))
				.reduce((m, e) => [...m, ...Object.values(e)], []);

			return {
				missing: dsResult.length ? dsResult.filter(v => v === null).length / dsResult.length : 0,
				incomplete: dsResult.length ? dsResult.filter(v => v !== null && v < 1).length / dsResult.length : 0,
				complete: dsResult.length ? dsResult.filter(v => v === 1).length / dsResult.length : 1,
				total: dsResult.length
			};
		}));

		return project.forms
			.map((ds, i) => i)
			.reduce((m, i) => { m[project.forms[i].id] = result[i]; return m; }, {})
	}

	static async fetchFormStatus(project, dataSourceId) {
		const response = await axios.get(
			'/api/resources/input',
			{params: {mode: 'ids_by_form', projectId: project._id, formId: dataSourceId}}
		);

		const result = {};

		for (let inputId in response.data) {
			const [siteId, period] = inputId.split(':').slice(-2);
			result[period] = result[period] || {};
			result[period][siteId] = response.data[inputId];
		}

		const dataSource = project.forms.find(ds => ds.id === dataSourceId);
		dataSource.entities.forEach(siteId => {
			let periods;
			if (dataSource.periodicity === 'free')
				periods = Object.keys(result);
			else {
				const site = project.entities.find(site => site.id == siteId);
				const [start, end] = [
					[project.start, site.start, dataSource.start].filter(a => a).sort().pop(),
					[project.end, site.end, dataSource.end, new Date().toISOString().substring(0, 10)].filter(a => a).sort().shift()
				];

				periods = Array.from(timeSlotRange(
					TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), dataSource.periodicity),
					TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), dataSource.periodicity)
				)).map(ts => ts.value);
			}

			periods.forEach(period => {
				result[period] = result[period] || {};

				if (result[period][siteId] === undefined)
					result[period][siteId] = null;
			});
		});

		// Sort periods alphabetically
		const sortedResult = {};
		Object.keys(result).sort().reverse().forEach(p => sortedResult[p] = result[p]);
		return sortedResult;
	}

	static async fetchLasts(projectId, siteId, dataSourceId, period) {
		const response = await axios.get(
			'/api/resources/input',
			{
				params: {
					mode: "current+last",
					projectId: projectId,
					entityId: siteId,
					formId: dataSourceId,
					period: period
				}
			}
		);

		const result = response.data.map(i => new Input(i));

		var currentInputId = ['input', projectId, dataSourceId, siteId, period].join(':');

		// both where found
		if (result.length === 2)
			return {current: result[0], previous: result[1]};

		// only the current one was found
		else if (result.length === 1 && result[0]._id === currentInputId)
			return {current: result[0], previous: null};

		else
			return {current: null, previous: result.length ? result[0] : null};
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

