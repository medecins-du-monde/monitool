import assert from 'assert';

const u = (c, n = 1) => `${c.repeat(8)}-${String(n).repeat(4)}-1111-1111-111111111111`;
const PROJECT_ID = 'project:' + u('1');
const FORM = u('2');
const SITE_1 = u('a'), SITE_2 = u('b');
const VAR = {scalar: u('3', 1), rows: u('3', 2), cols: u('3', 3), both: u('3', 4), deep: u('3', 5), last: u('3', 6)};
const PERIOD = '2026-03';

const partition = (id, name, ...items) => ({
  id: u('4', id), name, aggregation: 'sum', groups: [], elements: items.map((item, i) => ({id: u(String(id + 4), i + 1), name: item}))
});
const variable = (id, name, distribution, ...partitions) => ({id, name, timeAgg: 'sum', geoAgg: 'sum', distribution, partitions});

const elements = [
  variable(VAR.scalar, 'Scalar', 0),
  variable(VAR.rows, 'Rows', 1, partition(1, 'age', '<5', '5+')),
  variable(VAR.cols, 'Cols', 0, partition(2, 'sex', 'M', 'F')),
  variable(VAR.both, 'Both', 1, partition(1, 'age', '<5', '5+'), partition(2, 'sex', 'M', 'F')),
  variable(VAR.deep, 'Deep', 2, partition(1, 'age', '<5', '5+'), partition(2, 'sex', 'M', 'F'), partition(3, 'kind', 'a', 'b'), partition(4, 'type', 'c', 'd')),
  variable(VAR.last, 'Last', 0)
];

const projectDoc = {
  _id: PROJECT_ID, type: 'project', countries: [], name: 'P', start: '2026-01-01', end: '2026-12-31',
  visibility: 'private', active: true, themes: [],
  entities: [{id: SITE_1, name: 'Site 1'}, {id: SITE_2, name: 'Site/2'}],
  groups: [], logicalFrames: [], crossCutting: {}, extraIndicators: [], users: [],
  forms: [{id: FORM, name: 'Form', periodicity: 'month', entities: [SITE_1, SITE_2], start: null, end: null, elements}]
};

const fullValues = {
  [VAR.scalar]: [1],
  [VAR.rows]: [2, 3],
  [VAR.cols]: [4, 5],
  [VAR.both]: [6, 7, 8, 9],
  [VAR.deep]: Array.from({length: 16}, (_, i) => 100 + i),
  [VAR.last]: [10]
};

const structureOf = () => {
  const structure = {};
  elements.forEach(e => {
    structure[e.id] = e.partitions.map(p => ({id: p.id, items: p.elements.map(pe => pe.id), aggregation: p.aggregation}));
  });
  return structure;
};

const inputDoc = (site, values, structure) => ({
  _id: `input:${PROJECT_ID}:${FORM}:${site}:${PERIOD}`, _rev: `1-${'a'.repeat(32)}`, type: 'input', project: PROJECT_ID,
  form: FORM, entity: site, period: PERIOD, values, structure: structure || structureOf(), updatedAt: '2026-01-01T00:00:00.000Z'
});

describe('Data entry workbooks', function () {
  this.timeout(10000);
  let database, router, importRouter, parseSheet, originalClient, originalConfig, store, XLSX;

  before(() => {
    const configId = require.resolve('../../lib/config/config');
    originalConfig = require.cache[configId];
    require.cache[configId] = {id: configId, filename: configId, loaded: true,
      exports: {__esModule: true, default: {couchdb: {host: 'localhost'}, auth: {providers: {}}}}};
    database = require('../../lib/resource/database').default;
    originalClient = database.database;
    router = require('../../lib/routers/template').default;
    importRouter = require('../../lib/routers/import').default;
    parseSheet = require('../../lib/import/parse-sheet').default;
    try { XLSX = require('../../../../frontend/node_modules/xlsx'); } catch (e) { XLSX = null; }
  });

  beforeEach(() => {
    store = {[PROJECT_ID]: projectDoc};
    database.database = {
      get: async id => {
        if (!store[id]) throw Object.assign(new Error('missing'), {statusCode: 404});
        return JSON.parse(JSON.stringify(store[id]));
      }
    };
  });

  after(() => {
    database.database = originalClient;
    const configId = require.resolve('../../lib/config/config');
    if (originalConfig) require.cache[configId] = originalConfig;
    else delete require.cache[configId];
  });

  const request = async (activeRouter, method, path, body) => {
    const ctx = {
      path, method, request: {body}, response: {}, state: {user: {type: 'user', _id: 'user:admin', role: 'admin'}},
      visibleProjectIds: new Set([PROJECT_ID]), headers: {},
      set(key, value) { this.headers[key] = value; }
    };
    await activeRouter.routes()(ctx, async () => {});
    return ctx;
  };

  const exportWorkbook = async () => {
    const ctx = await request(router, 'GET', `/resources/project/${PROJECT_ID}/data-source-all-sites/${FORM}.xlsx/${PERIOD}`);
    const chunks = [];
    await new Promise((resolve, reject) => {
      ctx.body.on('data', chunk => chunks.push(chunk)).on('close', resolve).on('error', reject);
    });
    return XLSX.read(Buffer.concat(chunks), {type: 'buffer'});
  };

  const sheetRows = (workbook, name) => JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[name], {header: 1})));

  // A resave in Excel drops empty cells and leaves rows empty.
  const compact = rows => rows.map(row => row.every(c => c === null || c === '') ? [] : row);

  const dataSource = () => ({elements});

  describe('round trip with the real export', () => {
    before(function () { if (!XLSX) this.skip(); });

    it('reads back a filled export', async () => {
      store[inputDoc(SITE_1)._id] = inputDoc(SITE_1, fullValues);
      const workbook = await exportWorkbook();
      assert.deepStrictEqual(workbook.SheetNames, ['Site 1', 'Site-2']);
      const result = parseSheet(dataSource(), sheetRows(workbook, 'Site 1'));
      assert.deepStrictEqual(result.errors, []);
      assert.deepStrictEqual(result.values, fullValues);
    });

    it('reads back a sheet with no data as blank, never opened or resaved', async () => {
      const workbook = await exportWorkbook();
      const blank = {};
      Object.keys(fullValues).forEach(id => { blank[id] = fullValues[id].map(() => null); });

      [sheetRows(workbook, 'Site-2'), compact(sheetRows(workbook, 'Site-2'))].forEach(rows => {
        const result = parseSheet(dataSource(), rows);
        assert.deepStrictEqual(result.errors, []);
        assert.deepStrictEqual(result.values, blank);
      });
    });

    it('keeps blanks where they are in a partly filled sheet', async () => {
      const values = JSON.parse(JSON.stringify(fullValues));
      values[VAR.scalar] = [null];
      values[VAR.both] = [6, null, null, 9];
      values[VAR.last] = [null];
      store[inputDoc(SITE_1)._id] = inputDoc(SITE_1, values);
      const workbook = await exportWorkbook();
      const result = parseSheet(dataSource(), compact(sheetRows(workbook, 'Site 1')));
      assert.deepStrictEqual(result.errors, []);
      assert.deepStrictEqual(result.values, values);
    });

    it('exports an input saved under an older structure in the current cells', async () => {
      // Stored when the items of "sex" were in the opposite order.
      const structure = structureOf();
      structure[VAR.cols] = [Object.assign({}, structure[VAR.cols][0], {items: structure[VAR.cols][0].items.slice().reverse()})];
      const values = JSON.parse(JSON.stringify(fullValues));
      values[VAR.cols] = [5, 4];
      store[inputDoc(SITE_1)._id] = inputDoc(SITE_1, values, structure);

      const workbook = await exportWorkbook();
      const result = parseSheet(dataSource(), sheetRows(workbook, 'Site 1'));
      assert.deepStrictEqual(result.errors, []);
      assert.deepStrictEqual(result.values[VAR.cols], [4, 5]);
    });

    it('imports through the preview route', async () => {
      store[inputDoc(SITE_1)._id] = inputDoc(SITE_1, fullValues);
      const workbook = await exportWorkbook();
      const ctx = await request(importRouter, 'PUT',
        `/resources/project/${PROJECT_ID}/data-source-all-sites/${FORM}/${PERIOD}/${SITE_2}/preview`,
        {data: sheetRows(workbook, 'Site 1')});
      assert.strictEqual(ctx.response.body.status, 'ok');
      assert.deepStrictEqual(ctx.response.body.incoming, fullValues);
      assert.strictEqual(ctx.response.body.existing, null);
    });
  });

  describe('single-site check route', () => {
    const checkRows = async rows => {
      const form = {id: FORM, name: 'Form', periodicity: 'month', entities: [SITE_1], start: null, end: null,
        elements: [variable(VAR.scalar, 'Scalar', 0), variable(VAR.rows, 'Rows', 1, partition(1, 'age', '<5', '5+')), variable(VAR.last, 'Last', 0)]};
      store[PROJECT_ID] = Object.assign({}, projectDoc, {forms: [form]});
      return request(router, 'PUT', `/resources/project/${PROJECT_ID}/data-source/${FORM}/${SITE_1}/${PERIOD}/check`, [{name: 'x', data: rows}]);
    };
    const log = console.log;
    before(() => { console.log = () => {}; });
    after(() => { console.log = log; });

    it('reads a filled sheet', async () => {
      const ctx = await checkRows([['Scalar'], [], [1], [], [], ['Rows'], [], ['<5', 2], ['5+', 3], ['Total'], [], [], ['Last'], [], [4]]);
      assert.deepStrictEqual(ctx.response.body, {[VAR.scalar]: [1], [VAR.rows]: [2, 3], [VAR.last]: [4]});
    });

    it('reads a blank unpartitioned variable, first and last', async () => {
      const ctx = await checkRows([['Scalar'], [], [], [], [], ['Rows'], [], ['<5', 2], ['5+', 3], ['Total'], [], [], ['Last'], []]);
      assert.deepStrictEqual(ctx.response.body, {[VAR.scalar]: [null], [VAR.rows]: [2, 3], [VAR.last]: [null]});
    });

    it('refuses decimals and negatives, with the cell of each error', async () => {
      const ctx = await checkRows([['Scalar'], [], [1.5], [], [], ['Rows'], [], ['<5', -2], ['5+', 3], ['Total'], [], [], ['Last'], [], [4]]);
      assert.strictEqual(ctx.status, 404);
      assert.deepStrictEqual(ctx.body.map(e => [e.key, e.extra.element, e.extra.row, e.extra.col, e.extra.value]), [
        ['import.error.not-whole-number', 'Scalar', 3, 'A', '1.5'],
        ['import.error.not-whole-number', 'Rows', 8, 'B', '-2']
      ]);
    });

    it('reports the same structure errors as the multi-site import', async () => {
      const relabelled = await checkRows([['Scalar'], [], [1], [], [], ['Rows'], [], ['renamed', 2], ['5+', 3], ['Total'], [], [], ['Last'], [], [4]]);
      assert.deepStrictEqual(relabelled.body.map(e => e.key), ['import.error.bad-header']);

      const missing = await checkRows([['Scalar'], [], [1]]);
      assert.strictEqual(missing.status, 404);
      assert.deepStrictEqual(missing.body.map(e => e.key), ['import.error.no-table', 'import.error.no-table']);

      const notes = await checkRows([['Scalar'], [], [1], ['note'], [], ['Rows'], [], ['<5', 2], ['5+', 3], ['Total'], [], [], ['Last'], [], [4]]);
      assert.deepStrictEqual(notes.body.map(e => e.key), ['import.error.content-outside-table']);
    });

    it('still refuses several sheets', async () => {
      const ctx = await request(router, 'PUT', `/resources/project/${PROJECT_ID}/data-source/${FORM}/${SITE_1}/${PERIOD}/check`, [{name: 'a', data: []}, {name: 'b', data: []}]);
      assert.strictEqual(ctx.status, 404);
      assert.deepStrictEqual(ctx.body.map(e => e.key), ['import.error.bad-number-of-sheets']);
    });

    describe('with the real single-site export', () => {
      before(function () { if (!XLSX) this.skip(); });

      const download = async url => {
        const ctx = await request(router, 'GET', url);
        const chunks = [];
        await new Promise((resolve, reject) => {
          ctx.body.on('data', chunk => chunks.push(chunk)).on('close', resolve).on('error', reject);
        });
        const workbook = XLSX.read(Buffer.concat(chunks), {type: 'buffer'});
        return JSON.parse(JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header: 1})));
      };
      const check = rows => request(router, 'PUT', `/resources/project/${PROJECT_ID}/data-source/${FORM}/${SITE_1}/${PERIOD}/check`, [{name: 'x', data: rows}]);

      it('accepts a filled export', async () => {
        store[PROJECT_ID] = projectDoc;
        store[inputDoc(SITE_1)._id] = inputDoc(SITE_1, fullValues);
        const ctx = await check(await download(`/resources/project/${PROJECT_ID}/data-source/${FORM}.xlsx/${SITE_1}/${PERIOD}`));
        assert.deepStrictEqual(ctx.response.body, fullValues);
      });

      it('accepts a blank template', async () => {
        store[PROJECT_ID] = projectDoc;
        const ctx = await check(await download(`/resources/project/${PROJECT_ID}/data-source/${FORM}.xlsx`));
        const blank = {};
        Object.keys(fullValues).forEach(id => { blank[id] = fullValues[id].map(() => null); });
        assert.deepStrictEqual(ctx.response.body, blank);
      });
    });
  });
});
