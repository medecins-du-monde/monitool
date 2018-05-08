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

import axios from 'axios';
import uuid from 'uuid/v4';

export default class Theme {

	static async fetchAll() {
		const response = await axios.get('/api/resources/theme');
		return response.data.map(i => new Theme(i));
	}

	static async get(id) {
		const response = await axios.get('/api/resources/theme/' + id);
		return new Theme(response.data);
	}

	constructor(data=null) {
		this._id = 'theme:' + uuid();
		this.type = "theme";
		this.name = {en: '', fr: '', es: ''};

		if (data)
			Object.assign(this, data);
	}

	async save() {
		const response = await axios.put(
			'/api/resources/theme/' + this._id,
			JSON.parse(angular.toJson(this))
		);

		Object.assign(this, response.data);
	}

	async delete() {
		return axios.delete('/api/resources/theme/' + this._id);
	}

}

