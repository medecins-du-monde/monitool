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
import child_process from 'child_process';

const router = new Router();

/**
 * not really a queue: allows tracking waiting computations from subprocess.
 */
const queue = {};

/**
 * There is only one subprocess => global.
 */
let subprocess;

/**
 * start subprocess and listen to events.
 */
function startChild() {
	if (subprocess) {
		subprocess.removeListener('message', onSubprocessMessage);
		subprocess.removeListener('exit', onSubprocessExit);
	}

	subprocess = child_process.fork(`${__dirname}/../main-reporting.js`);
	subprocess.on('message', onSubprocessMessage);
	subprocess.on('exit', onSubprocessExit);
}

/**
 * Respond to however is waiting when we get news from subprocess.
 */
function onSubprocessMessage(message) {
	const queueItem = queue[message.messageId];

	if (queueItem) {
		if (message.result)
			queueItem.resolve(message.result);
		else
			queueItem.reject(message.error);

		clearTimeout(queueItem.timeout);
		delete queue[message.messageId];
	}
}

/**
 * restart subprocess when it crashes, and tell queued queries
 * that we won't answer.
 */
function onSubprocessExit(code) {
	// restart subprocess.
	startChild();

	// Fail all queued messages
	for (let msgId in queue) {
		const queueItem = queue[msgId];
		queueItem.reject(new Error('Reporting server crashed'));
		clearTimeout(queueItem.timeout);
		delete queue[msgId];
	}
}

/**
 * Handle timeouts when we asked something to subprocess and got
 * no answer.
 */
function onTimeout(msgId) {
	const queueItem = queue[msgId];
	queueItem.reject(new Error('Reporting server was too slow'));
	delete queue[msgId];
}

/**
 * Ask the subprocess to compute some reporting.
 */
async function queryReportingSubprocess(query) {
	// Create random message Id.
	const msgId = Math.random().toString().substring(2);

	// Send it to the reporting process.
	const msgSent = subprocess.send({messageId: msgId, query: query});
	if (!msgSent)
		throw new Error('Reporting server not available');

	// This promise will resolve when we get the answer from the subprocess
	// or fail if we timeout.
	return new Promise((resolve, reject) => {
		queue[msgId] = {};

		// Store promise handlers so that they can be handled when
		// getting message from subprocess.
		queue[msgId].resolve = resolve;
		queue[msgId].reject = reject;

		// Fail if the subprocess did not answer in 2.5 minutes.
		// (nginx timeout is set to 3 minutes).
		queue[msgId].timeout = setTimeout(
			onTimeout.bind(null, msgId),
			2.5 * 60 * 1000
		);
	});
}


startChild();


router.post('/reporting/project/:prjId', async ctx => {
	const query = {
		projectId: ctx.params.prjId,
		computation: ctx.request.body.computation,
		filter: ctx.request.body.filter,
		dimensionIds: ctx.request.body.dimensionIds,
		withTotals: ctx.request.body.withTotals,
		withGroups: ctx.request.body.withGroups
	};

	ctx.response.body = await queryReportingSubprocess(query);
	ctx.response.type = 'application/json';
});

export default router;

