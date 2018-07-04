
import axios from 'axios';
import TimeSlot, {timeSlotRange} from 'timeslot-dag';


const TIME_PERIODICITIES = [
	'day', 'month_week_sat', 'month_week_sun', 'month_week_mon', 'week_sat', 'week_sun',
	'week_mon', 'month', 'quarter', 'semester', 'year'
];


function* _generatePeriods(project, computation) {
	const parameters = Object.values(computation.parameters);
	const dataSources = project.forms.filter(ds => {
		return parameters.some(param => ds.elements.some(v => v.id === param.elementId));
	});

	// Get list of periodicities which are compatible with the computation
	const periodicities = TIME_PERIODICITIES.filter(periodicity => {
		return dataSources.every(dataSource => {
			if (dataSource.periodicity === 'free' || periodicity === dataSource.periodicity)
				return true;

			try {
				let t = TimeSlot.fromDate(new Date(), dataSource.periodicity);
				t.toUpperSlot(periodicity);
				return true;
			}
			catch (e) {
				return false;
			}
		});
	});

	// Get start & end date
	const start = dataSources.reduce((start, ds) => {
		return ds.start && ds.start > start ? ds.start : start;
	}, project.start);

	const end = dataSources.reduce((end, ds) => {
		return ds.end && ds.end < end ? ds.end : end;
	}, project.end);

	// Create dimensions
	// const variants = {};
	for (let periodicity of periodicities) {
		const rows = Array
			.from(timeSlotRange(
				TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), periodicity),
				TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), periodicity)
			))
			.map(slot => {
				return {
					id: slot.value,
					name: slot.value,
					isGroup: periodicity !== periodicities[0],
					filter: {
						[periodicity]: [slot.value] // FIXME would be better to use the native periodicity of the data source.
					}
				};
			});

		yield {
			id: periodicity,
			name: 'project.dimensions.' + periodicity,
			exclude: TIME_PERIODICITIES,
			rows: rows
		};
	}
}


// intersection of sites that are in this computation
function* _generateSites(project, computation) {
	const parameters = Object.values(computation.parameters);
	const dataSources = project.forms.filter(ds => {
		return parameters.some(param => ds.elements.some(variable => variable.id === param.elementId));
	});

	// Intersect sites used by data sources that are used to compute this variable.
	const siteIds = dataSources.reduce((siteIds, ds) => {
		return siteIds ? siteIds.filter(siteId => ds.entities.includes(siteId)) : ds.entities;
	}, null) || [];

	const siteRows = project.entities.map(site => {
		return {
			id: site.id,
			name: site.name,
			isGroup: false,
			filter: {
				entity: [site.id].filter(siteId => siteIds.includes(siteId))
			}
		}
	}).filter(row => row.filter.entity.length > 0);

	const groupRows = project.groups.map(group => {
		return {
			id: group.id,
			name: group.name,
			isGroup: true,
			filter: {
				entity: group.members.filter(siteId => siteIds.includes(siteId))
			}
		}
	}).filter(row => row.filter.entity.length > 0);

	yield {
		id: 'entity',
		name: 'project.dimensions.entity',
		exclude: ['entity', 'group'],
		rows: [...groupRows, ...siteRows]
	};
}


function* _generatePartitions(project, computation) {
	// Get all variables and computations parameters in arrays.
	const variables = project.forms.reduce((m, e) => m.concat(e.elements), []);
	const parameters = Object.values(computation.parameters);

	// Get partitions which are available in all variables used for the computation (<=> intersect parameters)
	let commonPartitions = parameters.reduce((memo, param) => {
		const partitions = variables.find(v => v.id === param.elementId).partitions;
		if (memo !== null)
			return partitions.filter(p => memo.some(p2 => p2.id == p.id))
		else
			return partitions;
	}, null) || [];

	// Remove partitions that are part of the computation.
	commonPartitions = commonPartitions.filter(partition => {
		return parameters.every(param => !param.filter[partition.id])
	});

	// Build dimensions
	for (let partition of commonPartitions) {
		const elementRows = partition.elements.map(element => {
			return {
				id: element.id,
				name: element.name,
				isGroup: false,
				filter: {[partition.id]: [element.id]}
			};
		});

		const groupRows = partition.groups.map(group => {
			return {
				id: group.id,
				name: group.name,
				isGroup: true,
				filter: {[partition.id]: group.members}
			};
		});

		yield {
			id: partition.id,
			name: partition.name,
			exclude: [partition.id],
			rows: [...groupRows, ...elementRows]
		};
	}
}


export function generateIndicatorDimensions(project, computation) {
	if (!computation)
		return [];

	return [
		..._generatePeriods(project, computation),
		..._generateSites(project, computation),
		..._generatePartitions(project, computation)
	];
}



export function *generateProjectDimensions(project) {
	// Time
	const timeVariants = {};

	timePeriodicities.forEach(periodicity => {

		let isValid = false;
		for (let dataSource of project.forms) {
			if (dataSource.periodicity === 'free' || dataSource.periodicity === periodicity) {
				isValid = true;
				break
			}

			try {
				TimeSlot
					.fromDate(new Date(), dataSource.periodicity)
					.toUpperSlot(periodicity);

				isValid = true;
				break;
			}
			catch (e) {}
		}

		if (isValid)
			timeVariants[periodicity] = Array
				.from(timeSlotRange(
					TimeSlot.fromDate(new Date(start + 'T00:00:00Z'), this.groupBy),
					TimeSlot.fromDate(new Date(end + 'T00:00:00Z'), this.groupBy)
				))
				.map(slot => slot.id);
	});

	// Sites
	const siteVariants = {}

	siteVariants['elements'] = project.entities.map(site => {
		return {id: site.id, name: site.name, filter: [site.id]};
	});

	if (project.groups) {
		siteVariants['groups'] = project.groups.map(group => {
			return {id: group.id, name: group.name, filter: group.members};
		});

		siteVariants['both'] = [...siteVariants['groups'], ...siteVariants['elements']];
	}

	yield {id: 'site', variants: siteVariants};
}



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

	return TIME_PERIODICITIES.filter(periodicity => {
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
	const result = Object
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

	// do not return null when formula is a fixed value.
	return result ? result : [];
}

// implement _fetch method here, and call it from the components
export async function fetchData(project, computation, dimensionIds, filter, withTotals, withGroups) {
	// No need to load if no computation is defined for the indicator.
	if (!computation)
		throw new Error('project.indicator_computation_missing');

	// No need to load if the periodicity is not available.
	const periodicities = computeCompatiblePeriodicities(project, computation);
	dimensionIds.forEach(dimensionId => {
		if (TIME_PERIODICITIES.includes(dimensionId) && !periodicities.includes(dimensionId))
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


