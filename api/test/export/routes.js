import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Excel from 'exceljs';
import ExportCache from '../../lib/export/cache';

describe('General Report export routes', function () {
  this.timeout(10000);
  let directory, cache, router, queries, projectReads;
  const originals = new Map();
  const project = {
    _id: 'project:1', countries: ['ES'], start: '2026-01-01', end: '2026-12-31',
    logicalFrames: [], themes: [], crossCutting: {}, forms: [],
    extraIndicators: [{display: 'Patients', computation: {formula: 'a', parameters: {a: {elementId: 'v', filter: {}}}}}],
    entities: [{id: 'a', name: 'Site A'}, {id: 'b', name: 'Site B'}]
  };
  function mock(module, exports) {
    const id = require.resolve(module);
    originals.set(id, require.cache[id]);
    require.cache[id] = {id, filename: id, loaded: true, exports};
  }
  before(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monitool-routes-test-'));
    cache = new ExportCache({directory});
    mock('../../lib/export/index', {__esModule: true, default: cache});
    mock('../../lib/routers/reporting', {queryReportingSubprocess: async query => {
      queries.push(query);
      return JSON.stringify({items: {'2026-03': 42, _total: 42}});
    }});
    mock('../../lib/resource/model/project', {__esModule: true, default: {storeInstance: {get: async () => {
      projectReads++;
      return JSON.parse(JSON.stringify(project));
    }}}});
    mock('../../lib/resource/model/indicator', {__esModule: true, default: {storeInstance: {list: async () => []}}});
    mock('../../lib/resource/model/theme', {__esModule: true, default: {}});
    mock('../../lib/resource/model/user', {__esModule: true, default: {}});
    router = require('../../lib/routers/downloads').default;
  });
  beforeEach(() => { cache.invalidate(); queries = []; projectReads = 0; });
  after(() => {
    delete require.cache[require.resolve('../../lib/routers/downloads')];
    originals.forEach((value, id) => { if (value) require.cache[id] = value; else delete require.cache[id]; });
    fs.readdirSync(directory).forEach(file => fs.unlinkSync(path.join(directory, file)));
    fs.rmdirSync(directory);
  });

  async function request(url, {allowed = true, body, method = 'GET'} = {}) {
    const parsed = new URL(url, 'http://localhost');
    const query = {};
    parsed.searchParams.forEach((value, key) => { query[key] = value; });
    const ctx = {
      path: parsed.pathname, method, query,
      request: {body}, visibleProjectIds: new Set(allowed ? ['project:1'] : []),
      headers: {}, set(key, value) { this.headers[key] = value; },
      throw(status, message) { const error = new Error(message); error.status = status; throw error; }
    };
    await router.routes()(ctx, async () => {});
    return ctx;
  }
  const base = '/export/project:1/month/en/true';
  const filters = '?filters=' + encodeURIComponent(JSON.stringify({_start: '2026-03-01', _end: '2026-03-31', entity: ['b']}));
  async function workbookFrom(ctx) {
    const buffer = await new Promise((resolve, reject) => {
      const chunks = [];
      ctx.body.on('data', chunk => chunks.push(chunk));
      ctx.body.on('end', () => resolve(Buffer.concat(chunks)));
      ctx.body.on('error', reject);
    });
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(buffer);
    return workbook;
  }

  it('serves a real filtered workbook and skips all calculations on an identical request', async () => {
    const first = await request(base + filters);
    assert.strictEqual(first.body.cached, false);
    assert(queries.length > 0);
    assert.deepStrictEqual(queries[0].filter, {_start: '2026-03-01', _end: '2026-03-31', entity: ['b']});
    const count = queries.length;
    const reads = projectReads;
    const second = await request(base + filters);
    assert.strictEqual(second.body.cached, true);
    assert.strictEqual(queries.length, count);
    assert.strictEqual(projectReads, reads);
    assert.strictEqual((await request(base + '/check' + filters)).body.message, 'done');
    assert.strictEqual((await request(base + '/check')).body.message, 'not done');
    const workbook = await workbookFrom(await request(base + '/file' + filters));
    assert.strictEqual(workbook.worksheets.length, 1);
    assert.strictEqual(workbook.worksheets[0].getCell('D1').value, '2026-03');
  });

  it('supports omitted minimized flags on check/file/progress routes', async () => {
    const detailed = '/export/project:1/month/en';
    await request(detailed + filters);
    assert.strictEqual((await request(detailed + '/progress' + filters)).body.percent, 100);
    const workbook = await workbookFrom(await request(detailed + '/file' + filters));
    assert.deepStrictEqual(workbook.worksheets.map(sheet => sheet.name), ['Global', 'Site B']);
  });

  it('checks project access for generation, check, progress and cached file downloads', async () => {
    await request(base + filters);
    for (const suffix of ['', '/check', '/progress', '/file']) {
      try { await request(base + suffix + filters, {allowed: false}); assert.fail('Expected forbidden'); }
      catch (error) { assert.strictEqual(error.status, 403); }
    }
  });

  it('separates simultaneous languages and date columns', async () => {
    const other = '/export/project:1/year/fr/true';
    await Promise.all([request(base + filters), request(other)]);
    const english = await workbookFrom(await request(base + '/file' + filters));
    const french = await workbookFrom(await request(other + '/file'));
    assert.strictEqual(english.worksheets[0].getCell('B1').value, 'Baseline');
    assert.strictEqual(french.worksheets[0].getCell('B1').value, 'Valeur initiale');
    assert.strictEqual(english.worksheets[0].getCell('D1').value, '2026-03');
    assert.strictEqual(french.worksheets[0].getCell('D1').value, '2026');
  });

  it('caches current-view snapshots separately for different expanded rows', async () => {
    const body = {projectId: 'project:1', language: 'en', periodicity: 'month', filters: {},
      data: [{Name: 'Patients', March: '42'}], headers: ['Name', 'March'], paddings: [0]};
    await workbookFrom(await request('/export/currentView', {method: 'POST', body}));
    await workbookFrom(await request('/export/currentView', {method: 'POST', body}));
    assert.strictEqual(cache.entries.size, 1);
    body.paddings = [1];
    await workbookFrom(await request('/export/currentView', {method: 'POST', body}));
    assert.strictEqual(cache.entries.size, 2);
    try {
      await request('/export/currentView', {method: 'POST', body, allowed: false});
      assert.fail('Expected forbidden');
    } catch (error) { assert.strictEqual(error.status, 403); }
  });
});
