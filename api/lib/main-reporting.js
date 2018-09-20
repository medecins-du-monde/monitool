import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import exprEval from 'expr-eval';

import Project from './resource/model/project';
import Input from './resource/model/input';
import Cube from './olap/cube';



process.on('message', m => {
	computeReport(m.query).then(
		result => process.send({messageId: m.messageId, result: result}),
		error => process.send({messageId: m.messageId, error: error})
	);
});


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


async function computeReport(query) {

	const project = await Project.storeInstance.get(query.projectId);

	// Make promises to query each independent parameter.
	const subQueries = Object.values(query.computation.parameters).map(async param => {
		// Get everything needed to compute the report.
		const dataSource = project.getDataSourceByVariableId(param.elementId);
		const variable = dataSource.getVariableById(param.elementId);
		const inputs = await Input.storeInstance.listByVariable(project, dataSource, variable, true);
		const cube = Cube.fromElement(project, dataSource, variable, inputs);

		// Merge query.filter and param.filter
		const filter = JSON.parse(JSON.stringify(query.filter));
		for (let key in param.filter)
			filter[key] =
				filter[key] ?
				filter[key].filter(e => param.filter[key].includes(e)) :
				param.filter[key];

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

		return cube.query(query.dimensionIds, filter, query.withTotals, query.withGroups);
	});

	// Wait for all of them to finish
	const variableResults = await Promise.all(subQueries);

	// Merge parameters into final result.
	const parser = new exprEval.Parser();
	parser.consts = {};

	return JSON.stringify(
		mergeRec(
			query.dimensionIds.length,
			parser.parse(query.computation.formula),
			Object.keys(query.computation.parameters),
			variableResults
		)
	);
}
