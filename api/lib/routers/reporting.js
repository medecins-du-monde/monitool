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

import Router from 'koa-router';
import cache from 'memory-cache';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

import Project from '../resource/model/project';
import Input from '../resource/model/input';
import Cube from '../olap/cube';


const router = new Router();


function mergeRec(fn, ...parameters) {
	if (['number', 'string'].includes(typeof parameters[0])) {
		const result = fn(...parameters);
		return Number.isNaN(result) ? 'Division by zero' : result;
	}

	const result = {};
	for (let key in parameters[0])
		result[key] = mergeRec(fn, ...parameters.map(p => p[key]));
	return result;
}


router.post('/reporting/project/:prjId', async ctx => {
	const project = await Project.storeInstance.get(ctx.params.prjId);
	const computation = ctx.request.body.computation;

	let subQueries = await Promise.all(
		Object.values(computation.parameters).map(async param => {
			// 
			const variableId = param.elementId;
			const extraFilter = param.filter;

			// 
			const dataSource = project.getDataSourceByVariableId(variableId);
			const variable = dataSource.getVariableById(variableId);
			const inputs = await Input.storeInstance.listByDataSource(project._id, dataSource.id, true);
			const cube = Cube.fromElement(project, dataSource, variable, inputs);

			// Merge parameter filters
			const filter = JSON.parse(JSON.stringify(ctx.request.body.filter));
			for (let key in extraFilter)
				filter[key] = filter[key] ? filter[key].filter(e => extraFilter[key].includes(e)) : extraFilter[key];

			// Replace _start/_end by a proper filter depending on our time dimension.
			if (filter._start && filter._end) {
				const timeDimension = dataSource.periodicity === 'free' ? 'day' : dataSource.periodicity;
				filter[timeDimension] = Array.from(
					timeSlotRange(
						TimeSlot.fromDate(new Date(filter._start + 'T00:00:00Z'), timeDimension),
						TimeSlot.fromDate(new Date(filter._end + 'T00:00:00Z'), timeDimension)
					)
				).map(ts => ts.value);

				delete filter._start;
				delete filter._end;
			}

			// FIXME this line should be useless => check
			filter.entity = filter.entity.filter(id => dataSource.entities.includes(id));

			return cube.query(
				ctx.request.body.dimensionIds,
				filter,
				ctx.request.body.withTotals,
				ctx.request.body.withGroups
			);
		})
	);

	const fn = new Function(
		...Object.keys(computation.parameters),
		'return ' + computation.formula
	);

	ctx.response.body = mergeRec(fn, ...subQueries);
});

export default router;
