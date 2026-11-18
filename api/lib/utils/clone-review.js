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

/**
 * The confirmations the owner must tick before removing the Clone tag.
 */
export const CLONE_TAG_CONFIRMATIONS = [
	'renamed', 'dates', 'sites', 'dataSources', 'logicalFrames', 'readyForInput', 'noDuplicate'
];

export function normalizeName(name) {
	return (name || '').trim().toLowerCase();
}

/**
 * Find the active projects that could be mistaken for the target project because they have the
 * same name. Works on projects_short rows (POJOs).
 */
export function findSimilarProjects(target, projects) {
	const targetName = normalizeName(target.name);

	return projects
		.filter(p => p._id !== target._id && p.active && normalizeName(p.name) === targetName)
		.map(p => ({ _id: p._id, name: p.name, countries: p.countries, start: p.start, end: p.end }));
}
