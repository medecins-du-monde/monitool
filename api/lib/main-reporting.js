import {Transform, Writable, pipeline} from 'stream';
import {promisify} from 'util';

import TimeSlot, {timeSlotRange} from 'timeslot-dag';
import exprEval from 'expr-eval';
import JSONStream from 'JSONStream';

import database from './resource/database';
import Project from './resource/model/project';
import Input from './resource/model/input';
import Cube from './olap/cube';


const pipelineP = promisify(pipeline);

const _cubeCache = {};

// Keep cubes in memory for 5 minutes at most.
setInterval(() => {
	const now = +new Date();

	for (const key in _cubeCache) {
		if (now - _cubeCache[key].time > 5 * 60 * 1000)
			delete _cubeCache[key];
	}
}, 5000);


process.on('message', m => {
	computeReport(m.query).then(
		result => process.send({messageId: m.messageId, result: result}),
		error => process.send({messageId: m.messageId, error: error})
	);
});


export async function computeReport(query) {
	const project = await Project.storeInstance.get(query.projectId);

	// Get result trees for each parameter
	const variableResults = await Promise.all(
		Object
			.values(query.computation.parameters)
			.map(param => _subQuery(project, query, param))
	);

	// Create expression to compute final result.
	const parser = new exprEval.Parser();
	parser.consts = {};
	parser.binaryOps['||'] = parser.binaryOps['or'] = (a, b) => typeof a !== 'number' ? b : a;

	const expression = parser.parse(query.computation.formula);

	// Merge into final result
	const result = _mergeRec(
		query.dimensionIds.length,
		expression,
		Object.keys(query.computation.parameters),
		variableResults
	);

	// Return a JSON string, which will be easier to cache and to send
	// to the parent process than a deep object tree.
	return JSON.stringify(result);
}

async function _subQuery(project, query, param) {
	const dataSource = project.getDataSourceByVariableId(param.elementId);
	const variable = dataSource.getVariableById(param.elementId);

	// Retrieve cube
	const cacheKey = [project._id, dataSource.id, variable.id].join(":");

	if (!_cubeCache[cacheKey])
		_cubeCache[cacheKey] = {
			time: +new Date(),
			cube: _createCube(project, dataSource, variable)
		}

	const cube = await _cubeCache[cacheKey].cube;

	return cube.query(
		query.dimensionIds,
		_createFilter(dataSource, query.filter, param.filter),
		query.withTotals,
		query.withGroups
	);
}

async function _createCube(project, dataSource, variable) {
	const cube = Cube.fromElement(project, dataSource, variable);

	// Query database, and stream the response in it.
	await pipelineP(
		database.database.viewAsStream(
			'monitool',
			'inputs_variable',
			{key: project._id + ':' + dataSource.id + ':' + variable.id}
		),
		JSONStream.parse(['rows', true]),
		new InputBuilder(project, dataSource, variable),
		new CubeFiller(cube, variable)
	);

	return cube;
}

function _createFilter(dataSource, queryFilter, paramFilter) {
	// Merge queryFilter and paramFilter
	const filter = JSON.parse(JSON.stringify(queryFilter));
	for (let key in paramFilter)
		filter[key] =
			filter[key] ?
			filter[key].filter(e => paramFilter[key].includes(e)) :
			paramFilter[key];

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

	return filter;
}

/**
 * When querying for a computed indicator (ex: 100 * a / b)
 * we query separately for a and b, and merge the results with this function.
 */
function _mergeRec(depth, expr, parameters, trees) {
	if (depth === 0) {
		const paramMap = {};
		parameters.forEach((key, index) => {
			paramMap[key] = typeof trees[index] !== 'undefined' ? trees[index] : 'unknown';
		});

		try {
			const result = expr.evaluate(paramMap);
			console.log('-----------------REPORTING------------------------')
			console.log(typeof result, result);
			if ((typeof result === 'number' && Number.isFinite(result)) || isNaN(Number(result)))
				return result;
			else
				return 'Not a finite number';
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
		result[key] = _mergeRec(
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

class InputBuilder extends Transform {

	constructor(project, dataSource, variable) {
		super({objectMode: true});

		this.project = project;
		this.dataSource = dataSource;
		this.structure = {[variable.id]: variable.structure};
	}

	_transform(row, encoding, callback) {
		const [projectId, dataSourceId, siteId, period] = row.id.split(':').slice(2);
		const variableId = row.key.split(':')[3];

		const input = Object.create(Input.prototype);
		input._id = row.id;
		input.type = 'input';
		input.project = 'project:' + projectId;
		input.form = dataSourceId;
		input.entity = siteId;
		input.period = period;
		input.structure = {[variableId]: row.value.s};
		input.values = {[variableId]: row.value.v};

		if (this._inputIsValid(input)) {
			input.update(this.structure);
			this.push(input);
		}

		callback();
	}

	_inputIsValid(input) {
		const timeSlot = new TimeSlot(input.period);
		const [startDate, endDate] = [timeSlot.firstDate.toISOString().slice(0, 10), timeSlot.lastDate.toISOString().slice(0, 10)];

		return this.project.start <= endDate
			&& this.project.end >= startDate
			&& (!this.dataSource.start || this.dataSource.start <= endDate)
			&& (!this.dataSource.end || this.dataSource.end >= startDate)
			&& this.dataSource.entities.includes(input.entity)
			&& this.dataSource.isValidSlot(input.period)
	}
}

class CubeFiller extends Writable {

	constructor(cube, variable) {
		super({objectMode: true});

		this.variable = variable;
		this.cube = cube;
	}

	_write(chunk, encoding, callback) {
		this.cube.fillFrom(this.variable, chunk);
		callback();
	}
}
