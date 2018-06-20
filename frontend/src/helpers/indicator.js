
import axios from 'axios';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';

const timePeriodicities = [
	'day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun',
	'week_mon', 'month', 'quarter', 'semester', 'year'
];

/**
 * A periodicity is compatible with a given indicator if
 * _all_ of the composing parameters can be converted to it.
 */
export function computeCompatiblePeriodicities(project, computation) { //fixme replace by indicator computation
	if (!computation)
		return [];

	const variableIds = Object
		.values(computation.parameters)
		.map(param => param.elementId);

	const dsPeriodicities = project.forms
		.filter(ds => ds.elements.some(variable => variableIds.includes(variable.id)))
		.map(ds => ds.periodicity);

	return timePeriodicities.filter(periodicity => {
		return dsPeriodicities.every(dsPeriodicity => {
			if (dsPeriodicity === 'free' || periodicity === dsPeriodicity)
				return true;

			try {
				let t = TimeSlot.fromDate(new Date(), dsPeriodicity);
				t.toUpperSlot(periodicity);
				return true;
			}
			catch (e) {
				return false;
			}
		});
	});
};

export function computeSplitPartitions(project, computation) {
	if (!computation)
		return [];

	// We need to keep only partitions that are common to all variables.
	return Object
		.values(computation.parameters)
		.reduce((memo, param) => {
			let partitions = project.forms
				.reduce((m, e) => m.concat(e.elements), [])
				.find(v => v.id === param.elementId)
				.partitions
				.filter(p => !param.filter[p.id])

			// intersect with memo
			if (memo)
				partitions = partitions.filter(p => memo.some(p2 => p2.id == p.id));

			return partitions;
		}, null);
}

// implement _fetch method here, and call it from the components
export async function fetchData(project, computation, dimensionIds, filter, withTotals, withGroups) {
	// No need to load if no computation is defined for the indicator.
	if (!computation)
		throw new Error('project.indicator_computation_missing');

	// No need to load if the periodicity is not available.
	const periodicities = computeCompatiblePeriodicities(project, computation);
	dimensionIds.forEach(dimensionId => {
		if (timePeriodicities.includes(dimensionId) && !periodicities.includes(dimensionId))
			throw new Error('project.not_available_min_' + periodicities[0])
	});

	// No need to load if any filter is empty
	for (let f of Object.values(filter)) {
		if (Array.isArray(f) && f.length === 0)
			return {};
	}

	// No need to load if value is fixed.
	if (Object.keys(computation.parameters).length === 0) {
		let result = parseFloat(computation.formula);
		for (let i = dimensionIds.length - 1; i >= 0; --i) {
			const dimId = dimensionIds[i];
			const newResult = {};

			let ids;
			if (filter[dimId])
				ids = filter[dimId]
			else if (periodicities.includes(dimId)) {
				ids = Array.from(
					timeSlotRange(
						TimeSlot.fromDate(new Date(filter._start + 'T00:00:00Z'), dimId),
						TimeSlot.fromDate(new Date(filter._end + 'T00:00:00Z'), dimId)
					)
				).map(s => s.value);
			}
			else
				throw new Error('could not find elements for ' + dimId)

			ids.forEach(id => newResult[id] = result);

			if (withGroups) {
				// throw new Error('')
			}

			if (withTotals)
				newResult._total = result;


			result = newResult;
		}

		return result;
	}

	// Otherwise, call the server for the data.
	const url = '/api/reporting/project/' + project._id;
	const data = {
		computation: computation,
		dimensionIds: dimensionIds,
		filter: filter,
		withTotals: withTotals,
		withGroups: withGroups
	};

	const response = await axios.post(url, data);
	return response.data;
}



