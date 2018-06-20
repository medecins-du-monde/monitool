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
import exprEval from 'expr-eval';
import factorial from 'factorial';
import uuid from 'uuid/v4';


export default class Project {

	static async fetchCrossCutting(indicatorId) {
		const response = await axios.get(
			'/api/resources/project',
			{params: {mode: 'crossCutting', indicatorId: indicatorId}}
		);

		return response.data.map(i => new Project(i));
	}

	static async fetchShort() {
		const response = await axios.get('/api/resources/project?mode=short');
		return response.data;
	}

	static async get(id) {
		const response = await axios.get('/api/resources/project/' + id);
		return new Project(response.data);
	}

	/**
	 * Does it makes sense to display links for input and reporting?
	 */
	get isReadyForReporting() {
		return this.forms.some(f => f.elements.length && f.entities.length);
	}

	constructor(data) {
		var now = new Date().toISOString().substring(0, 10);
		this._id = uuid()
		this.type = "project";
		this.name = "";
		this.start = now;
		this.end = now;
		this.themes = [];
		this.crossCutting = {};
		this.extraIndicators = [];
		this.logicalFrames = [];
		this.entities = [];
		this.groups = [];
		this.forms = [];
		this.users = [];
		this.visibility = 'public';

		if (data)
			Object.assign(this, data);
	}


	canInputForm(projectUser, formId) {
		if (!projectUser)
			return false;

		if (projectUser.role === 'owner')
			return true;

		if (projectUser.role === 'input') {
			// Check if user is explicitly forbidden
			if (!projectUser.dataSources.includes(formId))
				return false;

			// Check if entities where user is allowed intersect with the data source.
			var form = this.forms.find(f => f.id === formId);

			return !!projectUser.entities.filter(e => form.entities.includes(e)).length;
		}

		return false;
	}


	/**
	 * Scan all internal references to entities, variables, partitions, and partitions elements
	 * inside the project to ensure that there are no broken links and repair them if needed.
	 */
	sanitize(indicators) {
		if (!['private', 'public'].includes(this.visibility))
			this.visibility = 'private';

		//////////////////
		// Sanitize links to input entities
		//////////////////

		var entityIds = this.entities.map(e => e.id);

		// Filter groups members
		this.groups.forEach(group => {
			group.members = group.members.filter(e => entityIds.includes(e))
		});

		this.users.forEach(this._sanitizeUser, this);
		this.forms.forEach(this._sanitizeForm, this);

		/////////////
		// Sanitize links to variables from indicators
		/////////////

		this.logicalFrames.forEach(logicalFrame => {
			logicalFrame.indicators.forEach(this._sanitizeIndicator, this);
			logicalFrame.purposes.forEach(purpose => {
				purpose.indicators.forEach(this._sanitizeIndicator, this);
				purpose.outputs.forEach(output => {
					output.indicators.forEach(this._sanitizeIndicator, this);
					output.activities.forEach(activity => {
						activity.indicators.forEach(this._sanitizeIndicator, this);
					});
				});
			});
		});

		// Sanitize indicators only if the list is provided.
		if (indicators) {
			for (var indicatorId in this.crossCutting) {
				var indicator = indicators.find(i => i._id == indicatorId);
				var commonThemes = indicator.themes.filter(t => this.themes.includes(t));
				if (!indicator || commonThemes.length === 0)
					delete this.crossCutting[indicatorId];
			}
		}

		for (var indicatorId in this.crossCutting)
			this._sanitizeIndicator(this.crossCutting[indicatorId]);

		this.extraIndicators.forEach(this._sanitizeIndicator, this);
	}

	/**
	 * Scan all references to variables, partitions and partitions elements
	 * inside a given indicator to ensure that there are no broken links
	 * and repair them if needed.
	 */
	_sanitizeIndicator(indicator) {
		if (indicator.computation === null)
			return;

		// try to retrive the symbols from the formula.
		var symbols = null;
		try {
			symbols = exprEval.Parser.parse(indicator.computation.formula).variables();
		}
		catch (e) {
			// if we fail to retrieve symbols => computation is invalid.
			indicator.computation = null;
			return;
		}

		for (var key in indicator.computation.parameters) {
			// This key is useless.
			if (!symbols.includes(key)) {
				delete indicator.computation.parameters[key];
				continue;
			}

			var parameter = indicator.computation.parameters[key];
			var element = null;

			this.forms.forEach(f => {
				f.elements.forEach(e => {
					if (e.id === parameter.elementId)
						element = e;
				});
			});

			// Element was not found.
			if (!element) {
				indicator.computation = null;
				return;
			}

			for (var partitionId in parameter.filter) {
				var partition = element.partitions.find(p => p.id === partitionId);
				if (!partition) {
					indicator.computation = null;
					return;
				}

				var elementIds = parameter.filter[partitionId];
				for (var i = 0; i < elementIds.length; ++i) {
					if (!partition.elements.find(e => e.id === elementIds[i])) {
						indicator.computation = null;
						return;
					}
				}
			}
		}
	}

	/**
	 * Scan references to entities and remove broken links
	 * If no valid links remain, change the user to read only mode
	 */
	_sanitizeUser(user) {
		if (user.role === 'input') {
			user.entities = user.entities.filter(entityId => {
				return !!this.entities.find(entity => entity.id === entityId);
			});

			user.dataSources = user.dataSources.filter(dataSourceId => {
				return !!this.forms.find(form => form.id === dataSourceId);
			});

			if (user.entities.length == 0 || user.dataSources.length == 0) {
				delete user.entities;
				delete user.dataSources;
				user.role = 'read';
			}
		}
		else {
			delete user.entities;
			delete user.dataSources;
		}
	}

	_sanitizeForm(form) {
		var entityIds = this.entities.map(e => e.id);

		// Remove deleted entities
		form.entities = form.entities.filter(e => entityIds.includes(e));

		// Sanitize order and distribution
		form.elements.forEach(element => {
			if (element.distribution < 0 || element.distribution > element.partitions.length)
				element.distribution = Math.floor(element.partitions.length / 2);
		});

		if (form.periodicity === 'free')
			form.start = form.end = null;
	}

	async clone() {
		const newProjectId = 'project:' + uuid();

		await axios.put(
			'/api/resources/project/' + newProjectId,
			null,
			{
				params: {
					from: this._id,
					with_data: 'true'
				}
			}
		);

		return newProjectId;
	}

	async save() {
		const response = await axios.put(
			'/api/resources/project/' + this._id,
			JSON.parse(angular.toJson(this))
		);

		Object.assign(this, response.data);
	}

	async delete() {
		return axios.delete('/api/resources/project/' + this._id);
	}

}
