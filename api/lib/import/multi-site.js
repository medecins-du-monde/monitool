import crypto from 'crypto';
import TimeSlot from 'timeslot-dag';

import Input from '../resource/model/input';
import Project from '../resource/model/project';
import parseSheet, {readCellValue} from './parse-sheet';

const clone = value => JSON.parse(JSON.stringify(value));
const inputId = (project, dataSource, siteId, period) => ['input', project._id, dataSource.id, siteId, period].join(':');
const siteNames = (project, siteIds) => siteIds.map(id => project.entities.find(e => e.id === id).name).join(', ');
const hasValues = values => Object.keys(values).some(id => values[id].some(v => v !== null));

/**
 * Fingerprint of a data source's structure. Comparing inputs' revisions is not enough to detect that
 * the form changed since the preview: reordering items keeps array lengths but swaps the values' meaning.
 */
const getStructureHash = dataSource => crypto.createHash('sha1').update(JSON.stringify(dataSource.structure)).digest('hex');

/**
 * Tell if a site can receive an input for a period. Anything refused here would be either
 * invalid, or saved but hidden from the calendar (see InputStore.listIdsByDataSource).
 */
const isValidTarget = (project, dataSource, siteId, period) => {
	const entity = project.entities.find(e => e.id === siteId);
	if (!entity || !dataSource.entities.includes(siteId))
		return false;

	let slotStart, slotEnd;
	try {
		if (!dataSource.isValidSlot(period))
			return false;

		const timeSlot = new TimeSlot(period);
		slotStart = timeSlot.firstDate.toISOString().slice(0, 10);
		slotEnd = timeSlot.lastDate.toISOString().slice(0, 10);
	}
	catch (error) {
		return false;
	}

	const overlaps = (start, end) => (!start || start <= slotEnd) && (!end || end >= slotStart);

	// As in the calendar, site dates do not apply to free periodicity data sources.
	return overlaps(project.start, project.end)
		&& overlaps(dataSource.start, dataSource.end)
		&& (dataSource.periodicity === 'free' || overlaps(entity.start, entity.end));
};

/**
 * Values of a stored input, reshaped to the current structure, without altering the document.
 * Input.update must get its own copy: migrating values mutates them.
 */
const getCurrentValues = (rawInput, dataSource) => {
	const input = new Input(clone(rawInput));
	input.update(dataSource.structure);
	return input.values;
};

const getDataSource = (project, dataSourceId) => {
	const dataSource = project.getDataSourceById(dataSourceId);
	if (!dataSource)
		throw new Error('missing');

	return dataSource;
};

/**
 * Validate one sheet, and return what is needed to compare it with the existing data.
 * This does not write anything.
 */
export async function previewSite({projectId, dataSourceId, period, siteId, user, rows}) {
	const project = await Project.storeInstance.get(projectId);
	const dataSource = getDataSource(project, dataSourceId);

	if (!Array.isArray(rows) || !rows.every(row => row === null || Array.isArray(row)))
		throw new Error('invalid_data');

	if (!isValidTarget(project, dataSource, siteId, period))
		throw new Error('invalid_reference');

	if (!project.canEditInput(user, siteId, dataSource.id, false))
		throw new Error('forbidden');

	const rawInput = await Input.storeInstance.getRaw(inputId(project, dataSource, siteId, period));
	const blocked = !!(rawInput && rawInput.blocked);

	if (!project.canEditInput(user, siteId, dataSource.id, blocked))
		return {status: 'invalid', errors: [{key: 'import.error.site-locked'}]};

	const {values, errors} = parseSheet(dataSource, rows.map(row => row || []));
	if (errors.length)
		return {status: 'invalid', errors};

	return {
		status: 'ok',
		incoming: values,
		existing: rawInput ? getCurrentValues(rawInput, dataSource) : null,
		rev: rawInput ? rawInput._rev : null,
		blocked,
		blank: !hasValues(values),
		structureHash: getStructureHash(dataSource)
	};
}

/**
 * Values sent by a client are not trusted: same rules as reading a sheet.
 */
const areValidValues = (dataSource, values) => {
	if (!values || typeof values !== 'object')
		return false;

	const variableIds = dataSource.elements.map(element => element.id);

	return Object.keys(values).every(id => variableIds.includes(id))
		&& dataSource.elements.every(element => {
			const variableValues = values[element.id];
			return Array.isArray(variableValues)
				&& variableValues.length === element.numValues
				&& variableValues.every(value => value === null || (typeof value === 'number' && readCellValue(value) === value));
		});
};

const failure = (status, key, project, siteIds, unknownState = false) => ({
	status,
	body: {key, sites: siteIds, unknownState, extra: {sites: siteNames(project, siteIds)}}
});

/**
 * Undo the documents written by this import, and return the ids of the sites which could not be restored.
 */
const restore = async (written, targets) => {
	const docs = written.map(({target, rev}) => target.rawInput
		? Object.assign(clone(target.rawInput), {_rev: rev})
		: {_id: target.doc._id, _rev: rev, _deleted: true});

	if (!docs.length)
		return [];

	try {
		const results = await Input.storeInstance.bulkWrite(docs);
		return results.filter(result => result.error).map(result => targets.find(t => t.doc._id === result.id).siteId);
	}
	catch (error) {
		return written.map(({target}) => target.siteId);
	}
};

/**
 * Find what a failed bulk request actually wrote, from the stamp of this import.
 * Returns null if this can't be determined.
 */
const findWritten = async (targets, stamp) => {
	try {
		const docs = await Promise.all(targets.map(target => Input.storeInstance.getRaw(target.doc._id)));
		return targets
			.map((target, index) => ({target, doc: docs[index]}))
			.filter(({doc}) => doc && doc.updatedAt === stamp)
			.map(({target, doc}) => ({target, rev: doc._rev}));
	}
	catch (error) {
		return null;
	}
};

/**
 * Write the selected sites: all of them, or none.
 *
 * CouchDB has no multi-document transaction, hence everything that can be refused is checked before
 * writing, and whatever was written is restored if the write fails.
 *
 * @return {{status: number, body: Object}}
 */
export async function commitSites({projectId, dataSourceId, period, user, body}) {
	const project = await Project.storeInstance.get(projectId);
	const dataSource = getDataSource(project, dataSourceId);
	const sites = body && body.sites;

	if (!Array.isArray(sites) || !sites.length)
		throw new Error('invalid_data');

	const siteIds = sites.map(site => site && site.siteId);
	if (new Set(siteIds).size !== siteIds.length)
		throw new Error('invalid_data');

	if (!sites.every(site => site && areValidValues(dataSource, site.values)))
		throw new Error('invalid_data');

	if (!siteIds.every(siteId => isValidTarget(project, dataSource, siteId, period)))
		throw new Error('invalid_reference');

	if (!siteIds.every(siteId => project.canEditInput(user, siteId, dataSource.id, false)))
		throw new Error('forbidden');

	if (body.structureHash !== getStructureHash(dataSource))
		return failure(409, 'import.error.conflict', project, siteIds);

	const rawInputs = await Promise.all(siteIds.map(siteId => Input.storeInstance.getRaw(inputId(project, dataSource, siteId, period))));

	if (!siteIds.every((siteId, index) => project.canEditInput(user, siteId, dataSource.id, !!(rawInputs[index] && rawInputs[index].blocked))))
		throw new Error('forbidden');

	const conflicts = siteIds.filter((siteId, index) => (rawInputs[index] ? rawInputs[index]._rev : null) !== (sites[index].baseRev || null));
	if (conflicts.length)
		return failure(409, 'import.error.conflict', project, conflicts);

	const stamp = new Date().toISOString();
	const results = siteIds.map(siteId => ({siteId, status: 'unchanged'}));
	const targets = [];
	const uncleared = [];

	for (let index = 0; index < sites.length; index++) {
		const siteId = siteIds[index];
		const rawInput = rawInputs[index];
		// Only what the data source knows about, in its order.
		const values = {};
		dataSource.elements.forEach(element => { values[element.id] = sites[index].values[element.id]; });

		const current = rawInput ? getCurrentValues(rawInput, dataSource) : null;

		if (!hasValues(values)) {
			// Never create an empty input, and never clear a site without an explicit request.
			if (!current || !hasValues(current))
				continue;

			if (sites[index].confirmClear !== true) {
				uncleared.push(siteId);
				continue;
			}
		}

		if (current && dataSource.elements.every(element => JSON.stringify(current[element.id]) === JSON.stringify(values[element.id])))
			continue;

		const doc = {
			_id: inputId(project, dataSource, siteId, period),
			type: 'input',
			project: project._id,
			form: dataSource.id,
			entity: siteId,
			period,
			values,
			structure: dataSource.structure,
			updatedAt: stamp
		};

		if (rawInput) {
			doc._rev = rawInput._rev;
			if (rawInput.blocked !== undefined)
				doc.blocked = rawInput.blocked;
		}

		// Validates the final document: what fails here would break later reads of this input.
		await new Input(clone(doc)).validateForeignKeys(project);
		targets.push({siteId, doc, rawInput, result: results[index]});
	}

	if (uncleared.length)
		return failure(400, 'import.error.clear-not-confirmed', project, uncleared);

	if (!targets.length)
		return {status: 200, body: {results}};

	try {
		let bulkResults;
		try {
			bulkResults = await Input.storeInstance.bulkWrite(targets.map(target => target.doc));
		}
		catch (error) {
			const written = await findWritten(targets, stamp);
			if (!written)
				return failure(500, 'import.error.rollback-failed', project, siteIds, true);

			const notRestored = await restore(written, targets);
			return notRestored.length
				? failure(500, 'import.error.rollback-failed', project, notRestored)
				: failure(500, 'import.error.rolled-back', project, siteIds);
		}

		const failed = bulkResults.filter(result => result.error);
		if (failed.length) {
			const written = bulkResults
				.filter(result => !result.error)
				.map(result => ({target: targets.find(t => t.doc._id === result.id), rev: result.rev}));

			const notRestored = await restore(written, targets);
			if (notRestored.length)
				return failure(500, 'import.error.rollback-failed', project, notRestored);

			const failedSites = failed.map(result => targets.find(t => t.doc._id === result.id).siteId);
			return failed.every(result => result.error === 'conflict')
				? failure(409, 'import.error.conflict', project, failedSites)
				: failure(500, 'import.error.rolled-back', project, siteIds);
		}

		bulkResults.forEach(result => {
			const target = targets.find(t => t.doc._id === result.id);
			target.result.status = target.rawInput ? 'updated' : 'created';
			target.result.rev = result.rev;
		});

		return {status: 200, body: {results}};
	}
	finally {
		Project.storeInstance.invalidateInputsCache();
	}
}
