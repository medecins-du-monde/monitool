import assert from 'assert';
import child_process from 'child_process';
import {EventEmitter} from 'events';
import fs from 'fs';
import passwordHash from 'password-hash';

// The config module exits the process when these are missing.
process.env.MONITOOL_COOKIE_SECRET = process.env.MONITOOL_COOKIE_SECRET || 'test-cookie-secret';
process.env.MONITOOL_AUTH_ADMINISTRATOR = process.env.MONITOOL_AUTH_ADMINISTRATOR || 'test-admin';

async function rejectsWith(promise, message) {
	try {
		await promise;
	}
	catch (error) {
		assert.strictEqual(error.message, message);
		return error;
	}
	assert.fail('expected rejection with ' + message);
}

describe('Security: reporting API', function () {
	const validBody = {
		computation: {formula: 'a', parameters: {a: {elementId: 'v', filter: {}}}},
		filter: {}, dimensionIds: ['month'], withTotals: false, withGroups: false
	};
	let router, sent, originalFork;

	before(() => {
		// The router forks the reporting subprocess on load: answer from a fake one instead.
		originalFork = child_process.fork;
		child_process.fork = () => {
			const child = new EventEmitter();
			child.send = message => {
				sent.push(message);
				setImmediate(() => child.emit('message', {messageId: message.messageId, result: '{"items":{}}'}));
				return true;
			};
			return child;
		};
		delete require.cache[require.resolve('../../lib/routers/reporting')];
		router = require('../../lib/routers/reporting').default;
	});
	beforeEach(() => { sent = []; });
	after(() => {
		child_process.fork = originalFork;
		delete require.cache[require.resolve('../../lib/routers/reporting')];
	});

	async function post(projectId, body, visible = [projectId]) {
		const ctx = {
			path: '/reporting/project/' + projectId, method: 'POST',
			request: {body}, response: {}, visibleProjectIds: new Set(visible)
		};
		await router.routes()(ctx, async () => {});
		return ctx;
	}

	it('refuses projects the caller cannot see', async () => {
		await rejectsWith(post('project:private', validBody, ['project:other']), 'forbidden');
		assert.strictEqual(sent.length, 0);
	});

	it('refuses malformed requests', async () => {
		await rejectsWith(post('project:1', Object.assign({}, validBody, {computation: {formula: 1, parameters: {}}})), 'invalid_data');
		await rejectsWith(post('project:1', Object.assign({}, validBody, {dimensionIds: 'month'})), 'invalid_data');
		await rejectsWith(post('project:1', Object.assign({}, validBody, {computation: {formula: 'a', parameters: {a: {}}}})), 'invalid_data');
		assert.strictEqual(sent.length, 0);
	});

	it('computes reports for visible projects', async () => {
		const ctx = await post('project:1', validBody);
		assert.strictEqual(ctx.response.body, '{"items":{}}');
		assert.strictEqual(sent[0].query.projectId, 'project:1');
	});
});

describe('Security: formula parsing', function () {
	let parseFormula;
	before(() => { parseFormula = require('../../lib/main-reporting').parseFormula; });

	it('accepts arithmetic formulas', () => {
		assert.strictEqual(parseFormula('100 * a / b').evaluate({a: 1, b: 4}), 25);
		assert.strictEqual(parseFormula('(a + b) * 1.5').evaluate({a: 1, b: 1}), 3);
		assert.strictEqual(parseFormula('a || b').evaluate({a: 'missing', b: 2}), 2);
	});

	it('refuses member access, strings and oversized formulas', () => {
		assert.throws(() => parseFormula('a.__proto__'), /member access/);
		assert.throws(() => parseFormula('"x"'), /invalid_formula/);
		assert.throws(() => parseFormula('a[0]'), /invalid_formula/);
		assert.throws(() => parseFormula('a + '.repeat(300) + 'a'), /invalid_formula/);
		assert.throws(() => parseFormula(42), /invalid_formula/);
	});
});

describe('Security: partner passwords in project history', function () {
	const hash = 'sha1$salt$1$0123456789abcdef';
	let ProjectStore, Project, hidePartnerPasswords;

	before(() => {
		const store = require('../../lib/resource/store/project');
		ProjectStore = store.default;
		hidePartnerPasswords = store.hidePartnerPasswords;
		Project = require('../../lib/resource/model/project').default;
	});

	it('blanks partner passwords and keeps everything else', () => {
		const doc = {users: [
			{type: 'partner', username: 'p', password: hash},
			{type: 'internal', id: 'user:a', role: 'owner'}
		]};
		hidePartnerPasswords(doc);
		assert.deepStrictEqual(doc.users, [
			{type: 'partner', username: 'p', password: null},
			{type: 'internal', id: 'user:a', role: 'owner'}
		]);
	});

	it('never returns hashes from revisions saved before the fix', async () => {
		const revision = (time, users) => ({
			_id: 'rev:project:1:' + String(time).padStart(16, '0'), type: 'rev:project',
			name: 'v' + time, users
		});
		const store = new ProjectStore();
		Object.defineProperty(store, '_db', {value: {callList: async () => ({rows: [
			{doc: revision(3, [{type: 'partner', username: 'p', password: hash + 'new'}])},
			{doc: revision(2, [{type: 'partner', username: 'p', password: hash}])},
			{doc: revision(1, [])}
		]})}});

		const diffs = await store.listRevisions('project:1', 1, 20);
		assert(diffs.length > 0);
		assert(!JSON.stringify(diffs).includes('sha1$'));
	});

	it('stores new revisions without hashes, and keeps them on the live project', async () => {
		const inserted = [];
		const project = Object.create(Project.prototype);
		Object.assign(project, {_id: 'project:1', type: 'project', users: [{type: 'partner', username: 'p', password: null}]});
		Object.defineProperty(project, '_db', {value: {insert: async doc => { inserted.push(JSON.parse(JSON.stringify(doc))); }}});
		project.validateForeignKeys = async () => {};

		const originalGet = Project.storeInstance.get;
		Project.storeInstance.get = async () => ({
			_id: 'project:1', _rev: '1-a', type: 'project',
			users: [{type: 'partner', username: 'p', password: hash}]
		});
		try {
			await project.save(false, {_id: 'user:a'});
		}
		finally {
			Project.storeInstance.get = originalGet;
		}

		assert.strictEqual(inserted[0].users[0].password, hash);
		assert.strictEqual(inserted[1].type, 'rev:project');
		assert.strictEqual(inserted[1].users[0].password, null);
	});
});

describe('Security: sessions of disabled accounts', function () {
	let passport, User, Project;
	const originals = {};

	before(() => {
		passport = require('../../lib/passport').default;
		User = require('../../lib/resource/model/user').default;
		Project = require('../../lib/resource/model/project').default;
		originals.getUser = User.storeInstance.get;
		originals.getPartner = User.storeInstance.getPartner;
		originals.getProject = Project.storeInstance.get;

		const users = {
			'user:active': {_id: 'user:active', _rev: '1-a', type: 'user', role: 'common', active: true},
			'user:disabled': {_id: 'user:disabled', _rev: '1-a', type: 'user', role: 'common', active: false}
		};
		const partners = {
			live: {type: 'partner', username: 'live', password: passwordHash.generate('secret-pw'), role: 'input', projectId: 'project:live'},
			orphan: {type: 'partner', username: 'orphan', password: passwordHash.generate('secret-pw'), role: 'input', projectId: 'project:deleted'}
		};
		const projects = {'project:live': {active: true}, 'project:deleted': {active: false}};
		const missing = () => Promise.reject(new Error('missing'));

		User.storeInstance.get = async id => users[id] ? Object.assign({save: async () => {}}, users[id]) : missing();
		User.storeInstance.getPartner = async username => partners[username] ? Object.assign({}, partners[username]) : missing();
		Project.storeInstance.get = async id => projects[id] || missing();
	});
	after(() => {
		User.storeInstance.get = originals.getUser;
		User.storeInstance.getPartner = originals.getPartner;
		Project.storeInstance.get = originals.getProject;
	});

	const deserialize = id => new Promise((resolve, reject) =>
		passport.deserializeUser(id, (error, user) => error ? reject(error) : resolve(user)));
	const loginPartner = (username, password) => new Promise((resolve, reject) =>
		passport._strategy('partner_local')._verify(username, password, (error, user) => error ? reject(error) : resolve(user)));

	it('keeps active users logged in', async () => {
		assert.strictEqual((await deserialize('user:active'))._id, 'user:active');
	});

	it('ends sessions of deactivated and deleted users', async () => {
		assert.strictEqual(await deserialize('user:disabled'), false);
		assert.strictEqual(await deserialize('user:gone'), false);
	});

	it('ends sessions of partners whose project was deleted', async () => {
		assert.strictEqual((await deserialize('partner:live')).username, 'live');
		assert.strictEqual(await deserialize('partner:orphan'), false);
	});

	it('refuses partner logins on deleted projects', async () => {
		assert.strictEqual((await loginPartner('live', 'secret-pw')).username, 'live');
		assert.strictEqual(await loginPartner('orphan', 'secret-pw'), false);
		assert.strictEqual(await loginPartner('live', 'wrong-pw'), false);
	});
});

describe('Security: indicator and cross-cutting exports', function () {
	this.timeout(10000);
	const indicatorName = 'SecurityTestIndicator';
	const originals = new Map();
	let router, queriedProjects;

	const project = (id, name) => ({
		_id: id, name, countries: ['ES'], continents: ['EU'], start: '2026-01-01', end: '2026-12-31',
		themes: [], forms: [], logicalFrames: [], extraIndicators: [], entities: [],
		crossCutting: {'indicator:1': {computation: {formula: 'a', parameters: {a: {elementId: 'v', filter: {}}}}}}
	});
	const projects = [project('project:visible', 'Visible'), project('project:private', 'Private')];

	function mock(module, exports) {
		const id = require.resolve(module);
		originals.set(id, require.cache[id]);
		require.cache[id] = {id, filename: id, loaded: true, exports};
	}

	before(() => {
		mock('../../lib/export/index', {__esModule: true, default: {}});
		mock('../../lib/routers/reporting', {queryReportingSubprocess: async query => {
			queriedProjects.push(query.projectId);
			return JSON.stringify({items: {_total: 1}});
		}});
		mock('../../lib/resource/model/project', {__esModule: true, default: {storeInstance: {
			listByIndicator: async () => JSON.parse(JSON.stringify(projects)),
			listByIndicators: async () => JSON.parse(JSON.stringify(projects))
		}}});
		mock('../../lib/resource/model/indicator', {__esModule: true, default: {storeInstance: {
			get: async id => ({_id: id, name: {en: indicatorName}, themes: []})
		}}});
		mock('../../lib/resource/model/theme', {__esModule: true, default: {}});
		mock('../../lib/resource/model/user', {__esModule: true, default: {}});
		delete require.cache[require.resolve('../../lib/routers/downloads')];
		router = require('../../lib/routers/downloads').default;
	});
	beforeEach(() => { queriedProjects = []; });
	after(() => {
		delete require.cache[require.resolve('../../lib/routers/downloads')];
		originals.forEach((value, id) => { if (value) require.cache[id] = value; else delete require.cache[id]; });
		fs.readdirSync('.').filter(file => file.includes(indicatorName)).forEach(file => fs.unlinkSync(file));
	});

	async function get(url, user, visible) {
		const ctx = {
			path: url, method: 'GET', query: {}, request: {}, response: {},
			state: {user}, visibleProjectIds: new Set(visible),
			headers: {}, set(key, value) { this.headers[key] = value; },
			throw(status, message) { const error = new Error(message); error.status = status; throw error; }
		};
		await router.routes()(ctx, async () => {});
		return ctx;
	}

	const staff = {type: 'user', role: 'common'};
	const partner = {type: 'partner', role: 'owner', projectId: 'project:visible'};

	async function waitForFile(predicate) {
		for (let i = 0; i < 50 && !fs.readdirSync('.').some(predicate); i++)
			await new Promise(resolve => setTimeout(resolve, 20));
	}

	it('refuses partners', async () => {
		const error = await rejectsWith(get('/export/indicator:1/month/en/check', partner, ['project:visible']), 'forbidden');
		assert.strictEqual(error.status, 403);
		await rejectsWith(get('/export-newCC/indicator:1/en/check', partner, ['project:visible']), 'forbidden');
	});

	it('only exports projects the caller can see, and never shares files across views', async () => {
		const ctx = await get('/export/indicator:1/month/en', staff, ['project:visible']);
		assert.strictEqual(ctx.body, '{ "message": "done" }');
		assert(queriedProjects.length > 0);
		assert.deepStrictEqual([...new Set(queriedProjects)], ['project:visible']);

		await waitForFile(file => file.includes(indicatorName) && file.endsWith('.xlsx'));
		assert.strictEqual((await get('/export/indicator:1/month/en/check', staff, ['project:visible'])).body, '{ "message": "done" }');
		assert.strictEqual(
			(await get('/export/indicator:1/month/en/check', staff, ['project:visible', 'project:private'])).body,
			'{ "message": "not done" }'
		);
	});

	it('refuses project ids on the legacy indicator routes', async () => {
		// Project exports are answered by the access-checked handler: an unknown project is refused there.
		await rejectsWith(get('/export/project:private/month/en/check', staff, ['project:visible']), 'forbidden');
	});
});
