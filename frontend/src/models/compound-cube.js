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

import exprEval from 'expr-eval';
import Cube from './cube';

const createDimension = function(dimensionId, childDimension, computation, cubes) {
	// Take all lists of items from the real dimensions
	var itemsLists = [];
	for (var key in computation.parameters) {
		var cube = cubes[computation.parameters[key].elementId],
			dimension = cube.dimensionsById[dimensionId] || cube.dimensionGroupsById[dimensionId];

		itemsLists.push(dimension.items);
	}

	// union them
	var items = itemsLists.reduce(function(memo, arr) {
		return memo == null ? arr.slice() : memo.concat(arr.filter(function(el) { return memo.indexOf(el) === -1; }));
	}, null) || [];

	// sort what remains (why? those the display order depends on this one?)
	items.sort();

	// our new dimension is the intersection of all the others (child dimension might be undefined but that's ok)
	return {id: dimensionId, childDimension: childDimension, items: items};
};



export default class CompoundCube extends Cube {

	constructor(computation, cubes) {
		const dimensions = [];
		const dimensionGroups = [];

		// The dimensions that our CompoundCube will have is the intersection of the dimensions
		// of all of the other cubes => compute that.
		// first: retrieve all dimensions and groups for parameters of computation
		var dimensionIds = [];
		for (var key in computation.parameters) {
			var cube = cubes[computation.parameters[key].elementId],
				dims = [...Object.keys(cube.dimensionsById), ...Object.keys(cube.dimensionGroupsById)];

			dimensionIds.push(dims);
		}

		// intersect them to know which dimensions we have left.
		dimensionIds = dimensionIds.reduce(function(memo, arr) {
			return memo == null ? arr.slice() : memo.filter(function(el) { return arr.indexOf(el) !== -1; });
		}, null) || [];

		// create fake dimensions and groups to mimic the intersection of the cubes.
		if (dimensionIds.indexOf('day') !== -1) {
			dimensions.push(createDimension('day', undefined, computation, cubes));
			dimensionGroups.push(createDimension('week_sat', 'day', computation, cubes));
			dimensionGroups.push(createDimension('week_sun', 'day', computation, cubes));
			dimensionGroups.push(createDimension('week_mon', 'day', computation, cubes));
			dimensionGroups.push(createDimension('month_week_sat', 'day', computation, cubes));
			dimensionGroups.push(createDimension('month_week_sun', 'day', computation, cubes));
			dimensionGroups.push(createDimension('month_week_mon', 'day', computation, cubes));
			dimensionGroups.push(createDimension('month', 'day', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'day', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'day', computation, cubes));
			dimensionGroups.push(createDimension('year', 'day', computation, cubes));
		}
		else if (dimensionIds.indexOf('month_week_sat') !== -1) {
			dimensions.push(createDimension('month_week_sat', undefined, computation, cubes));
			dimensionGroups.push(createDimension('week_sat', 'month_week_sat', computation, cubes));
			dimensionGroups.push(createDimension('month', 'month_week_sat', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'month_week_sat', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'month_week_sat', computation, cubes));
			dimensionGroups.push(createDimension('year', 'month_week_sat', computation, cubes));
		}
		else if (dimensionIds.indexOf('month_week_sun') !== -1) {
			dimensions.push(createDimension('month_week_sun', undefined, computation, cubes));
			dimensionGroups.push(createDimension('week_sun', 'month_week_sun', computation, cubes));
			dimensionGroups.push(createDimension('month', 'month_week_sun', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'month_week_sun', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'month_week_sun', computation, cubes));
			dimensionGroups.push(createDimension('year', 'month_week_sun', computation, cubes));
		}
		else if (dimensionIds.indexOf('month_week_mon') !== -1) {
			dimensions.push(createDimension('month_week_mon', undefined, computation, cubes));
			dimensionGroups.push(createDimension('week_mon', 'month_week_mon', computation, cubes));
			dimensionGroups.push(createDimension('month', 'month_week_mon', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'month_week_mon', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'month_week_mon', computation, cubes));
			dimensionGroups.push(createDimension('year', 'month_week_mon', computation, cubes));
		}
		else if (dimensionIds.indexOf('week_sat') !== -1) {
			dimensions.push(createDimension('week_sat', undefined, computation, cubes));
			dimensionGroups.push(createDimension('month', 'week_sat', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'week_sat', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'week_sat', computation, cubes));
			dimensionGroups.push(createDimension('year', 'week_sat', computation, cubes));
		}
		else if (dimensionIds.indexOf('week_sun') !== -1) {
			dimensions.push(createDimension('week_sun', undefined, computation, cubes));
			dimensionGroups.push(createDimension('month', 'week_sun', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'week_sun', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'week_sun', computation, cubes));
			dimensionGroups.push(createDimension('year', 'week_sun', computation, cubes));
		}
		else if (dimensionIds.indexOf('week_mon') !== -1) {
			dimensions.push(createDimension('week_mon', undefined, computation, cubes));
			dimensionGroups.push(createDimension('month', 'week_mon', computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'week_mon', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'week_mon', computation, cubes));
			dimensionGroups.push(createDimension('year', 'week_mon', computation, cubes));
		}
		else if (dimensionIds.indexOf('month') !== -1) {
			dimensions.push(createDimension('month', undefined, computation, cubes));
			dimensionGroups.push(createDimension('quarter', 'month', computation, cubes));
			dimensionGroups.push(createDimension('semester', 'month', computation, cubes));
			dimensionGroups.push(createDimension('year', 'month', computation, cubes));
		}
		else if (dimensionIds.indexOf('quarter') !== -1) {
			dimensions.push(createDimension('quarter', undefined, computation, cubes));
			dimensionGroups.push(createDimension('semester', 'quarter', computation, cubes));
			dimensionGroups.push(createDimension('year', 'quarter', computation, cubes));
		}
		else if (dimensionIds.indexOf('semester') !== -1) {
			dimension.push(createDimension('semester', undefined, computation, cubes));
			dimensionGroups.push(createDimension('year', 'semester', computation, cubes));
		}
		else {
			dimensions.push(createDimension('year', undefined, computation, cubes));
		}

		if (dimensionIds.indexOf('entity') !== -1) {
			dimensions.push(createDimension('entity', undefined, computation, cubes));

			if (dimensionIds.indexOf('group') !== -1)
				dimensionGroups.push(createDimension('group', 'entity', computation, cubes));
		}

		super(null, dimensions, dimensionGroups, null);
		delete this.data;

		this.computation = computation;

		this.cubes = {}; // we could leave everything here, but it's easier to debug with less clutter.
		for (key in computation.parameters)
			this.cubes[computation.parameters[key].elementId] = cubes[computation.parameters[key].elementId];
	}

	_query_total(filter) {
		var localScope = {};

		for (var key in this.computation.parameters) {
			var parameter = this.computation.parameters[key],
				cube = this.cubes[parameter.elementId];

			var finalFilter = angular.copy(filter)
			for (var key2 in parameter.filter)
				finalFilter[key2] = parameter.filter[key2];

			try {
				localScope[key] = cube._query_total(finalFilter);
			}
			catch (e) {
				localScope[key] = undefined;
			}

			if (typeof localScope[key] === 'string') // 'AGGREGATION_FORBIDDEN', 'INVALID_AGGREGATION_MODE'
				return localScope[key];
		}

		try {
			var result = exprEval.Parser.evaluate(this.computation.formula, localScope);
			return typeof result === "number" && isNaN(result) ? 'MISSING_DATA' : result;
		}
		catch (e) {
			return 'INVALID_FORMULA';
		}
	}

}
