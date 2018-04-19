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

import Store from './store';
import Project from '../model/project';

export default class ProjectStore extends Store {

	get modelString() {
		return 'project';
	}

	get modelClass() {
		return Project;
	}

	async listVisibleIds(user) {
		if (user.type === 'partner')
			return [user.projectId];

		else if (user.type === 'user') {
			let dbResults;
			if (user.role === 'admin')
				dbResults = (await this._db.callView('by_type', {key: 'project'})).rows;
			else {
				const [publicIds, privateIds] = await Promise.all([
					this._db.callView('projects_public'),
					this._db.callView('projects_private', {key: user._id})
				]);

				dbResults = [...publicIds.rows, ...privateIds.rows];
			}

			return dbResults.map(row => row.id);
		}

		else
			throw new Error('invalid_user');
	}

	/**
	 * Retrieve list of all projects summaries
	 * Most fields are missing from this query (hence, it returns POJOs instead of Project's instances).
	 *
	 * Used in the client to display list of projects.
	 */
	async listShort(userId) {
		if (typeof userId !== 'string')
			throw new Error('missing_parameter');

		var view = 'projects_short';

		const result = await this._db.callView(view, {});
		var projects = result.rows.map(row => row.value);

		projects.forEach(function(p) {
			p.users = p.users.filter(u => u.id === userId)
		});

		return projects;
	}

	/**
	 * Retrieve all projects that collect a given indicator.
	 * The projects are stripped down before sending (the subset is selected to ensure that client,
	 * has enought info to compute the cross-cutting indicator).
	 *
	 * Used in the client to display cross-cutting reporting.
	 */
	async listByIndicator(indicatorId, strippedDown) {
		if (typeof indicatorId !== 'string')
			throw new Error("missing_parameter");

		const result = await this._db.callView('cross_cutting', {key: indicatorId, include_docs: true});
		var projects = result.rows.map(row => row.doc);

		// strip down project
		if (strippedDown) {
			projects.forEach(function(project) {
				var cc = {}
				cc[indicatorId] = project.crossCutting[indicatorId];
				project.crossCutting = cc;

				var used = {};
				if (project.crossCutting[indicatorId].computation)
					for (var key in project.crossCutting[indicatorId].computation.parameters)
						used[project.crossCutting[indicatorId].computation.parameters[key].elementId] = true;

				project.logicalFrames = project.users = project.themes = [];
				project.forms.forEach(function(f) { f.elements = f.elements.filter(e => used[e.id]); });
				project.forms = project.forms.filter(f => f.elements.length);
				project.extraIndicators = [];
			});
		}

		return projects.map(p => new Project(p));
	}

	/**
	 * Retrieve all projects that are associated with a given theme
	 * This is used to update the projects when deleting a theme
	 */
	async listByTheme(themeId) {
		if (typeof themeId !== 'string')
			throw new Error("missing_parameter");

		const result = await this._db.callView('project_by_theme', {key: themeId, include_docs: true});
		return result.rows.map(row => new Project(row.doc));
	}

}
