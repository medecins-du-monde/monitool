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
import Indicator from '../model/indicator';
import jsonpatch from 'fast-json-patch';


var hashFunction = function(obj) {
	if (typeof obj === 'string')
		return obj;
	else
		return obj.id || obj.username || obj.display || obj.name;
};

/**
 * Compare two arrays of objects, and create remove, add and move operations
 * to patch from the first to the second.
 */
var compareArray = function(before, after, changes, prefix) {
	var beforeIds = before.map(hashFunction),
		afterIds = after.map(hashFunction);

	// if the hash function is not working, DO NOT TRY
	// jsonpatch will take over
	if (beforeIds.indexOf(undefined) !== -1 || afterIds.indexOf(undefined) !== -1)
		return;

	// start by removing items
	for (var beforeIndex = 0; beforeIndex < beforeIds.length; ++beforeIndex) {
		var id = beforeIds[beforeIndex], afterIndex = afterIds.indexOf(id);

		if (afterIndex === -1) {
			// element was removed
			beforeIds.splice(beforeIndex, 1);
			before.splice(beforeIndex, 1);
			changes.push({op: 'remove', path: prefix + beforeIndex});
			beforeIndex--; // we need to recheck the same place in the table.
		}
	}

	// add missing items at the end
	for (var afterIndex = 0; afterIndex < afterIds.length; ++afterIndex) {
		var id = afterIds[afterIndex], beforeIndex = beforeIds.indexOf(id);

		if (beforeIndex === -1) {
			// element was added
			beforeIds.push(id);
			before.push(after[afterIndex]);
			changes.push({op: 'add', path: prefix + beforeIds.length, value: after[afterIndex]});
		}
	}

	// reorder items
	for (var afterIndex = 0; afterIndex < afterIds.length; ++afterIndex) {
		var id = afterIds[afterIndex], beforeIndex = beforeIds.indexOf(id);

		if (afterIndex !== beforeIndex) {
			// vire l'item de before
			var item = before.splice(beforeIndex, 1)[0];
			beforeIds.splice(beforeIndex, 1);

			// le remet au bon endroit
			before.splice(afterIndex, 0, item);
			beforeIds.splice(afterIndex, 0, id);
			changes.push({op: 'move', from: prefix + beforeIndex, path: prefix + afterIndex})
		}
	}
};


var compareRec = function(before, after, changes, prefix='/') {
	if (Array.isArray(before) && Array.isArray(after)) {
		compareArray(before, after, changes, prefix);

		for (var i = 0; i < before.length; ++i)
			compareRec(before[i], after[i], changes, prefix + i + '/')
	}
	else if (typeof before === 'object' && typeof after === 'object') {
		for (var key in before)
			if (after[key])
				compareRec(before[key], after[key], changes, prefix + key + '/');
	}
};

var compare = function(before, after) {
	before = JSON.parse(JSON.stringify(before)); // clone

	let moves = [];
	compareRec(before, after, moves, '/');

	const operations = moves.concat(jsonpatch.compare(before, after));



	return operations;
};


export default class ProjectStore extends Store {

	get modelString() {
		return 'project';
	}

	get modelClass() {
		return Project;
	}

	async listRevisions(projectId, offset, limit) {
		if (typeof projectId !== 'string')
			throw new Error('missing_parameter');

		offset = Number.isNaN(offset * 1) ? 0 : offset * 1;
		limit = Number.isNaN(limit * 1) ? 20 : limit * 1;

		// Get revisions.
		// There is a special case to handle when offset = 0 (we need current project).
		let revisions;
		if (offset === 0) {
			let project;
			[project, revisions] = await Promise.all([
				this.get(projectId),
				this._db.callList({
					include_docs: true,
					startkey: 'rev:' + projectId + ':9999999999999999',
					endkey: 'rev:' + projectId + ':0000000000000000',
					descending: true,
					limit: limit
				})
			]);
			revisions.rows.unshift({id: project._id, doc: project});
		}
		else
			revisions = await this._db.callList({
				include_docs: true,
				startkey: 'rev:' + projectId + ':9999999999999999',
				endkey: 'rev:' + projectId + ':0000000000000000',
				descending: true,
				skip: offset - 1,
				limit: limit + 1
			});

		// Compute diffs over time.
		let diffs = [];
		for (let i = 0; i < revisions.rows.length; ++i) {
			const doc = revisions.rows[i].doc;
			const time = new Date(parseInt(doc._id.substr(-16)));
			const user = doc.modifiedBy;

			// Clear fields that are different on revisions and projects to avoid messing with the patches.
			delete doc._id;
			delete doc.type;
			delete doc._rev;
			delete doc.modifiedBy;

			if (i > 0)
				diffs.push({
					time: time,
					user: user,
					backwards: compare(revisions.rows[i - 1].doc, doc),
					forwards: compare(doc, revisions.rows[i - 1].doc)
				});
		}

		return diffs;
	}

	async listVisibleIds(user) {
		if (user.type === 'partner')
			return [user.projectId];

		else if (user.type === 'user') {
			let dbRows;

			if (user.role === 'admin') {
				const dbResult = await this._db.callList({startkey: 'project:!', endkey: 'project:~'});
				dbRows = dbResult.rows;
			}
			else {
				const [publicIds, privateIds] = await Promise.all([
					this._db.callView('projects_public'),
					this._db.callView('projects_private', {key: user._id})
				]);

				dbRows = [...publicIds.rows, ...privateIds.rows];
			}

			return dbRows.map(row => row.id);
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

		const [mainResult, updatedAtResult] = await Promise.all([
			this._db.callView('projects_short', {}),
			this._db.callView('inputs_updated_at', {group: true})
		]);

		const projects = mainResult.rows.map(row => row.value);

		projects.forEach(p => {
			const updatedAt = updatedAtResult.rows.find(row => row.key === p._id);

			p.inputDate = updatedAt ? updatedAt.value : null;
			p.users = p.users.filter(u => u.id === userId);
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

		const indicator = await Indicator.storeInstance.get(indicatorId);

		let projects = await this.list();
		projects = projects.filter(p => p.active && p.themes.some(themeId => indicator.themes.includes(themeId)));

		// strip down project
		if (strippedDown) {
			projects.forEach(function(project) {
				var cc = {}
				if (project.crossCutting[indicatorId])
					cc[indicatorId] = project.crossCutting[indicatorId];
				project.crossCutting = cc;

				var used = {};
				if (project.crossCutting[indicatorId] && project.crossCutting[indicatorId].computation)
					for (var key in project.crossCutting[indicatorId].computation.parameters)
						used[project.crossCutting[indicatorId].computation.parameters[key].elementId] = true;

				project.logicalFrames = project.users = project.themes = [];
				project.forms.forEach(function(f) { f.elements = f.elements.filter(e => used[e.id]); });
				project.forms = project.forms.filter(f => f.elements.length);
				project.extraIndicators = [];
			});
		}

		return projects;
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
