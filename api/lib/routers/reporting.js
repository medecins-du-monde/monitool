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
import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import exprEval from 'expr-eval';
import Redis from 'ioredis';
import hash from 'object-hash';


import Project from '../resource/model/project';
import Input from '../resource/model/input';
import Cube from '../olap/cube';


const router = new Router();
const redis = new Redis({host: 'redis'});

/**
 * When querying for a computed indicator (ex: 100 * a / b)
 * we query separately for a and b, and merge the results with this function.
 */
function mergeRec(depth, expr, parameters, trees) {
	if (depth === 0) {
		const paramMap = {};
		parameters.forEach((key, index) => paramMap[key] = trees[index]);

		try {
			const result = expr.evaluate(paramMap);

			if (typeof result !== 'number' || !Number.isFinite(result))
				throw new Error();
			return result;
		}
		catch (e) {
			return 'Invalid computation'
		}
	}

	const keys = new Set(
		trees
			.map(p => p ? Object.keys(p) : [])
			.reduce((memo, keys) => [...memo, ...keys], [])
	);

	const result = {};
	for (let key of keys)
		result[key] = mergeRec(
			depth - 1,
			expr,
			parameters,
			trees.map(p => {
				if (p !== undefined)
					return p[key];
				else
					return depth <= 1 ? undefined : {};
			})
		);

	return result;
}


router.post('/reporting/project/:prjId', async ctx => {
	const project = await Project.storeInstance.get(ctx.params.prjId);
	const computation = ctx.request.body.computation;

	// Force response type to be JSON, as we will provide a string to Koa.
	let finalResult = null;

	// Compute cache key dependent on the query
	const cacheKey = ctx.params.prjId + ':' + hash(ctx.request.body, {unorderedObjects: true, algorithm: 'md5'});
	try {
		/////////
		// Try to respond from cache.
		/////////

		finalResult = await redis.get(cacheKey);
		if (!finalResult)
			throw new Error();
	}
	catch (e) {
		/////////
		// Generate fresh response.
		/////////

		// Make promises to query each independent parameter.
		const subQueries = Object.values(computation.parameters).map(async param => {
			// Convenience alias
			const variableId = param.elementId;
			const extraFilter = param.filter;

			// Get everything needed to compute the report.
			const dataSource = project.getDataSourceByVariableId(variableId);
			const variable = dataSource.getVariableById(variableId);
			const inputs = await Input.storeInstance.listByVariable(project, dataSource, variable, true);
			const cube = Cube.fromElement(project, dataSource, variable, inputs);

			// Merge parameter filters
			const filter = JSON.parse(JSON.stringify(ctx.request.body.filter));
			for (let key in extraFilter)
				filter[key] = filter[key] ? filter[key].filter(e => extraFilter[key].includes(e)) : extraFilter[key];

			// Replace _start/_end by a proper filter depending on our time dimension.
			if (filter._start && filter._end) {
				const timeDimension = dataSource.periodicity === 'free' ? 'day' : dataSource.periodicity;
				const timeValues = Array.from(
					timeSlotRange(
						TimeSlot.fromDate(new Date(filter._start + 'T00:00:00Z'), timeDimension),
						TimeSlot.fromDate(new Date(filter._end + 'T00:00:00Z'), timeDimension)
					)
				).map(ts => ts.value);

				delete filter._start;
				delete filter._end;

				if (filter[timeDimension])
					filter[timeDimension] = filter[timeDimension].filter(e => timeValues.includes(e));
				else
					filter[timeDimension] = timeValues;
			}

			return cube.query(
				ctx.request.body.dimensionIds,
				filter,
				ctx.request.body.withTotals,
				ctx.request.body.withGroups
			);
		});

		// Wait for all of them to finish
		const variableResults = await Promise.all(subQueries);

		// Merge parameters into final result.
		const parser = new exprEval.Parser();
		parser.consts = {};

		finalResult = JSON.stringify(
			mergeRec(
				ctx.request.body.dimensionIds.length,
				parser.parse(computation.formula),
				Object.keys(computation.parameters),
				variableResults
			)
		);

		// no await: No need to wait for redis to respond to user.
		redis.set(cacheKey, finalResult, 'EX', 3600);
	}

	ctx.response.body = finalResult;
	ctx.response.type = 'application/json';
});

export default router;
