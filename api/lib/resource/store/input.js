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

import TimeSlot from 'timeslot-dag';
import Store from './store';
import Input from '../model/input';
import Project from '../model/project';

export default class InputStore extends Store {

	get modelString() {
		return 'input';
	}

	get modelClass() {
		return Input;
	}

	/**
	 * Retrieve all input ids that are linked to a particular data source.
	 * Used to populate datasource planning (/projects/xxx/input).
	 */
	async listIdsByDataSource(projectId, dataSourceId, update = false) {
		if (typeof projectId !== 'string' || typeof dataSourceId !== 'string')
			throw new Error('missing_parameter');

		const options = {
			startkey: "input:" + projectId + ":" + dataSourceId + ":0",
			endkey: "input:" + projectId + ":" + dataSourceId + ":g"
		};

		const dbResult = await this._db.callView('inputs_with_progress', options);

		if (update) {
			const project = await Project.storeInstance.get(projectId);
			const dataSource = project.getDataSourceById(dataSourceId);

			// Remove inputs that are no longer relevant
			dbResult.rows = dbResult.rows.filter(row => {
				const [siteId, period] = row.id.split(':').slice(4);
				const timeSlot = new TimeSlot(period);
				const [startDate, endDate] = [timeSlot.firstDate.toISOString().slice(0, 10), timeSlot.lastDate.toISOString().slice(0, 10)];

				return dataSource
					&& project.start <= endDate
					&& project.end >= startDate
					&& (!dataSource.start || dataSource.start <= endDate)
					&& (!dataSource.end || dataSource.end >= startDate)
					&& dataSource.entities.includes(siteId)
					&& dataSource.isValidSlot(period);
			});
		}

		const result = {};
		dbResult.rows.forEach(item => result[item.id] = item.value);
		return result;
	}

	/**
	 * Retrieve all inputs of a given project
	 * Used to generate cubes (for project reporting), or fetch partner inputs.
	 */
	async listByProject(projectId, update = false) {
		if (typeof projectId !== 'string')
			throw new Error('missing_parameter');

		const result = await this._db.callList({
			include_docs: true,
			startkey: 'input:' + projectId + ':!',
			endkey: 'input:' + projectId + ':~'
		});

		let inputs = result.rows.map(row => new Input(row.doc));
		if (update) {
			const project = await Project.storeInstance.get(projectId);

			// Remove inputs that are no longer relevant
			inputs = inputs.filter(input => {
				const dataSource = project.getDataSourceById(input.form);
				const timeSlot = new TimeSlot(input.period);
				const [startDate, endDate] = [timeSlot.firstDate.toISOString().slice(0, 10), timeSlot.lastDate.toISOString().slice(0, 10)];

				return dataSource
					&& project.start <= endDate
					&& project.end >= startDate
					&& (!dataSource.start || dataSource.start <= endDate)
					&& (!dataSource.end || dataSource.end >= startDate)
					&& dataSource.entities.includes(input.entity)
					&& dataSource.isValidSlot(input.period);
			});

			// Update structure
			inputs.forEach(input => {
				const dataSource = project.getDataSourceById(input.form);
				input.update(dataSource.structure)
			});
		}

		return inputs;
	}

	/**
	 * Retrieve a given input, and the previous one for the same data source and site,
	 * This is used to populate the input page in client.
	 */
	async getLasts(projectId, dataSourceId, siteId, period, update = false) {
		if (typeof projectId !== 'string' || typeof dataSourceId !== 'string' || typeof siteId !== 'string' || typeof period !== 'string')
			throw new Error('missing_parameter');

		const id = 'input:' + projectId + ":" + dataSourceId + ":" + siteId + ":" + period;
		const result = await this._db.callList({
			startkey: id,
			endkey: 'input:' + projectId + ":" + dataSourceId + ":" + siteId,
			descending: true,
			limit: 2,
			include_docs: true
		});

		let inputs;
		if (result.rows.length === 0)
			inputs = [];

		else if (result.rows.length === 1)
			inputs = [new Input(result.rows[0].doc)];

		else if (result.rows.length === 2) {
			var first = new Input(result.rows[0].doc);
			if (first.period === period)
				inputs = [first, new Input(result.rows[1].doc)];
			else
				inputs = [first];
		}
		else
			throw new Error('couchdb did not respect limit=2');

		if (update) {
			const project = await Project.storeInstance.get(projectId);
			const dataSource = project.getDataSourceById(dataSourceId);

			inputs.forEach(input => input.update(dataSource.structure));
		}

		return inputs;
	}

	async bulkSave(inputs) {
		inputs = inputs.slice();

		while (inputs.length)
			await this._db.callBulk({ docs: inputs.splice(0, 40) });
	}
}

