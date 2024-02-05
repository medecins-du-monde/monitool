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
		if (_cubeCache[key] && now - _cubeCache[key].time > 5 * 60 * 1000)
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
	const variableResults = [];
	const cachedItems = [];
	const subQueries = await Promise.all(
		Object
			.values(query.computation.parameters)
			.map(param =>  _subQuery(project, query, param))
	);

	subQueries.forEach(subQuery => {
		variableResults.push(subQuery.cube),
		cachedItems.push(subQuery.cachedItem)
	})

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
	return JSON.stringify({cachedItems, items: result});
}

async function _subQuery(project, query, param) {
	const dataSource = project.getDataSourceByVariableId(param.elementId);
	const variable = dataSource.getVariableById(param.elementId);

	// Retrieve cube
	const cacheKey = [project._id, dataSource.id, variable.id].join(":");
	
	if (query.refreshCache) {
		if (_cubeCache[cacheKey]) {
			delete _cubeCache[cacheKey];
		}
	}

	if (!_cubeCache[cacheKey]) {
		console.log('newCache');
		_cubeCache[cacheKey] = {
			time: +new Date(),
			cube: _createCube(project, dataSource, variable)
		}
	}

	const cube = await _cubeCache[cacheKey].cube;

	return {
		cachedItem: {
			time: _cubeCache[cacheKey].time,
			key: cacheKey
		},
		cube: cube.query(
			query.dimensionIds,
			_createFilter(dataSource, query.filter, param.filter, query.dimensionIds[0]),
			query.withTotals,
			query.withGroups
		)
	}
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

function _createFilter(dataSource, queryFilter, paramFilter, dimension) {
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

		// Removes last timeslot if its range gets outside the filter end (ignore dimension weekly periodicities)
		if (!dimension.includes('week')) {
			const lastTimeSlotEnd = new TimeSlot(timeValues[timeValues.length - 1]).lastDate.toISOString().slice(0, 10);
			if (
				Number(lastTimeSlotEnd.slice(5, 7)) > Number(filter._end.slice(5, 7)) ||
				Number(lastTimeSlotEnd.slice(0, 4)) > Number(filter._end.slice(0, 4))
			) {
				timeValues.pop();
			}
		}

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
		const getInnermostParentheses = (expression) => {
			const regex = /\(([^()]+)\)/g;
			let matches = expression.match(regex);
		
			let innermostParentheses = '';
		
			if (matches && matches.length > 0) {
				innermostParentheses = matches[matches.length - 1];
			}
		
			return innermostParentheses;
		}
		
		const paramMap = {};
    parameters.forEach((key, index) => {
			paramMap[key] =
			typeof trees[index] !== "undefined" ? trees[index] : "unknown";
    });
		
		const couldBeZero = {};
		parameters.forEach((key) => {
			const expressionContainsKey = (expression) => {
				const regex = new RegExp(`\\b${key}\\b`);
				return regex.test(expression);
			}
      if (!isNaN(Number(paramMap[key]))) return;

      let auxExpr = expr.toString();

      // Initialize couldBeZero
      couldBeZero[key] = auxExpr.includes("(");

      // This flags tells us if the parameter is in an expression
      // with another parameter that isn't missing
      let flag = false;

      const ZERO_FRIENDLY_OPS = ["+", "-"];

      while (auxExpr.includes("(")) {
        // The toString() method of exprEval.Expression adds parentheses
        // So we don't need to worry, there will always be a pair of parentheses
        // per operation
        const innermostParentheses = getInnermostParentheses(auxExpr);

        // If the expression isn't zero-friendly, it couldn't be zero
        if (
          expressionContainsKey(innermostParentheses) &&
          !ZERO_FRIENDLY_OPS.some((op) => innermostParentheses.includes(op))
        ) {
          couldBeZero[key] = false;
          break;
        }

				// If the current parameter is in an expression with another parameter
				// that isn't missing, set the flag to true
        if (
          parameters.some(
            (p) =>
              innermostParentheses.includes(p) && !isNaN(Number(paramMap[p]))
          )
        )
          flag = true;

        auxExpr = auxExpr.replace(innermostParentheses, "$");
      }

			if (!flag) couldBeZero[key] = false;
    });

		const zeroFriendlyParams = parameters.filter(p => couldBeZero[p]);
		zeroFriendlyParams.forEach(p => paramMap[p] = 0);

		try {
			const result = expr.evaluate(paramMap);
			if ((typeof result === 'number' && Number.isFinite(result)))
				return zeroFriendlyParams.length > 0 ? `${result}` : result;
			else if (isNaN(result)) {
				const variables = expr.variables();
				if (!['numerator', 'denominator'].every(v => variables.includes(v)))
					return result;
				
				const num = paramMap['numerator'];
				const den = paramMap['denominator'];

				if (num === 'missing-data' || den === 'missing-data') return 'missing-data';
				if (den === 0) return 'division-by-zero';
				
				return result;
			}
			else if (typeof result === 'string' && !isNaN(Number(result)))
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
		const entity = this.project.entities.find(entity => entity.id === input.entity);

		return this.project.start <= endDate
			&& this.project.end >= startDate
			&& (!this.dataSource.start || this.dataSource.start <= endDate)
			&& (!this.dataSource.end || this.dataSource.end >= startDate)
			&& this.dataSource.entities.includes(input.entity)
			&& this.dataSource.isValidSlot(input.period)
			&& (!entity.start || entity.start <= endDate)
			&& (!entity.end || entity.end >= startDate)
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
