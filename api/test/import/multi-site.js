import assert from 'assert';

const uuid = n => `${String(n).repeat(8)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(4)}-${String(n).repeat(12)}`.slice(0, 36);
const rev = n => `${n}-${'a'.repeat(32)}`;

const PROJECT_ID = 'project:' + uuid(1);
const FORM = uuid(2), VAR_A = uuid(3), VAR_B = uuid(4), PARTITION = uuid(5), ITEM_1 = uuid(6), ITEM_2 = uuid(7);
const SITE_1 = 'a'.repeat(8) + '-1111-1111-1111-111111111111';
const SITE_2 = 'b'.repeat(8) + '-1111-1111-1111-111111111111';
const SITE_LATE = 'c'.repeat(8) + '-1111-1111-1111-111111111111';
const OTHER_SITE = 'd'.repeat(8) + '-1111-1111-1111-111111111111';
const PERIOD = '2026-03';
const OWNER = {type: 'user', _id: 'user:owner', role: 'common'};
const INPUT_USER = {type: 'user', _id: 'user:input', role: 'common'};
const READ_USER = {type: 'user', _id: 'user:read', role: 'common'};

const projectDoc = {
  _id: PROJECT_ID, type: 'project', countries: [], name: 'P', start: '2026-01-01', end: '2026-12-31', visibility: 'private', active: true, themes: [],
  entities: [
    {id: SITE_1, name: 'Site 1', start: null, end: null},
    {id: SITE_2, name: 'Site 2', start: null, end: null},
    {id: SITE_LATE, name: 'Late', start: '2026-06-01', end: null},
    {id: OTHER_SITE, name: 'Other', start: null, end: null}
  ],
  groups: [], logicalFrames: [], crossCutting: {}, extraIndicators: [],
  users: [
    {type: 'internal', id: 'user:owner', role: 'owner'},
    {type: 'internal', id: 'user:input', role: 'input', entities: [SITE_1], dataSources: [FORM]},
    {type: 'internal', id: 'user:read', role: 'read'}
  ],
  forms: [{
    id: FORM, name: 'Form', periodicity: 'month', entities: [SITE_1, SITE_2, SITE_LATE], start: null, end: null,
    elements: [
      {id: VAR_A, name: 'A', timeAgg: 'sum', geoAgg: 'sum', distribution: 0, partitions: []},
      {id: VAR_B, name: 'B', timeAgg: 'sum', geoAgg: 'sum', distribution: 1, partitions: [
        {id: PARTITION, name: 'p', aggregation: 'sum', groups: [], elements: [{id: ITEM_1, name: 'x'}, {id: ITEM_2, name: 'y'}]}
      ]}
    ]
  }]
};

const idOf = site => `input:${PROJECT_ID}:${FORM}:${site}:${PERIOD}`;
const sheetRows = (a, x, y) => [['A'], [], [a], [], [], ['B'], [], ['x', x], ['y', y], ['Total', null]];
const structure = {[VAR_A]: [], [VAR_B]: [{id: PARTITION, items: [ITEM_1, ITEM_2], aggregation: 'sum'}]};
const storedInput = (site, values, extra = {}) => Object.assign({
  _id: idOf(site), _rev: rev(1), type: 'input', project: PROJECT_ID, form: FORM, entity: site, period: PERIOD,
  values, structure: JSON.parse(JSON.stringify(structure)), updatedAt: '2026-01-01T00:00:00.000Z'
}, extra);

describe('Multi-site import: preview and commit', () => {
  let database, service, Project, originalConfig, originalClient, store, bulkCalls, bulkImpl;

  const noError = async (promise, expected) => {
    try { await promise; }
    catch (error) { assert.strictEqual(error.message, expected); return; }
    assert.fail(`Expected ${expected}`);
  };

  before(() => {
    const configId = require.resolve('../../lib/config/config');
    originalConfig = require.cache[configId];
    require.cache[configId] = {id: configId, filename: configId, loaded: true,
      exports: {__esModule: true, default: {couchdb: {host: 'localhost'}, auth: {providers: {}}}}};
    database = require('../../lib/resource/database').default;
    originalClient = database.database;
    Project = require('../../lib/resource/model/project').default;
    service = require('../../lib/import/multi-site');
  });

  beforeEach(() => {
    store = {[PROJECT_ID]: projectDoc};
    bulkCalls = [];
    bulkImpl = docs => docs.map(doc => ({id: doc._id, rev: rev(2)}));
    database.database = {
      get: async id => {
        if (store[id] instanceof Error) throw store[id];
        if (!store[id]) throw Object.assign(new Error('missing'), {statusCode: 404});
        return JSON.parse(JSON.stringify(store[id]));
      },
      bulk: async ({docs}) => {
        bulkCalls.push(JSON.parse(JSON.stringify(docs)));
        return bulkImpl(docs, bulkCalls.length);
      }
    };
  });

  after(() => {
    database.database = originalClient;
    const configId = require.resolve('../../lib/config/config');
    if (originalConfig) require.cache[configId] = originalConfig;
    else delete require.cache[configId];
  });

  const preview = (site, rows, user = OWNER, period = PERIOD, form = FORM) => service.previewSite({
    projectId: PROJECT_ID, dataSourceId: form, period, siteId: site, user, rows
  });
  const hash = async () => (await preview(SITE_2, sheetRows(1, 1, 1))).structureHash;
  const commit = async (sites, user = OWNER, structureHash) => service.commitSites({
    projectId: PROJECT_ID, dataSourceId: FORM, period: PERIOD, user,
    body: {structureHash: structureHash || await hash(), sites}
  });
  const values = (a, x, y) => ({[VAR_A]: [a], [VAR_B]: [x, y]});

  describe('preview', () => {
    it('returns incoming values with no existing data', async () => {
      const result = await preview(SITE_1, sheetRows(1, 2, 3));
      assert.strictEqual(result.status, 'ok');
      assert.deepStrictEqual(result.incoming, values(1, 2, 3));
      assert.strictEqual(result.existing, null);
      assert.strictEqual(result.rev, null);
      assert.strictEqual(result.blank, false);
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('treats a deleted document as no existing data', async () => {
      store[idOf(SITE_1)] = Object.assign(new Error('deleted'), {statusCode: 404});
      assert.strictEqual((await preview(SITE_1, sheetRows(1, 2, 3))).existing, null);
    });

    it('does not report a database failure as no existing data', async () => {
      store[idOf(SITE_1)] = new Error('ECONNREFUSED');
      await noError(preview(SITE_1, sheetRows(1, 2, 3)), 'ECONNREFUSED');
    });

    it('returns existing values reshaped to the current structure', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, {[VAR_A]: [9]}, {structure: {[VAR_A]: []}});
      const result = await preview(SITE_1, sheetRows(1, 2, 3));
      assert.deepStrictEqual(result.existing, {[VAR_A]: [9], [VAR_B]: [null, null]});
      assert.strictEqual(result.rev, rev(1));
    });

    it('flags blank sheets', async () => {
      assert.strictEqual((await preview(SITE_1, sheetRows(null, null, null))).blank, true);
    });

    it('returns sheet errors as a result', async () => {
      const result = await preview(SITE_1, sheetRows(1, 2.5, 3));
      assert.strictEqual(result.status, 'invalid');
      assert.strictEqual(result.errors[0].key, 'import.error.not-whole-number');
    });

    it('enforces permissions', async () => {
      assert.strictEqual((await preview(SITE_1, sheetRows(1, 2, 3), INPUT_USER)).status, 'ok');
      await noError(preview(SITE_2, sheetRows(1, 2, 3), INPUT_USER), 'forbidden');
      await noError(preview(SITE_1, sheetRows(1, 2, 3), READ_USER), 'forbidden');
    });

    it('stops input users on locked sites, not owners', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 1, 1), {blocked: true});
      const refused = await preview(SITE_1, sheetRows(1, 2, 3), INPUT_USER);
      assert.deepStrictEqual(refused.errors.map(e => e.key), ['import.error.site-locked']);
      const allowed = await preview(SITE_1, sheetRows(1, 2, 3), OWNER);
      assert.strictEqual(allowed.status, 'ok');
      assert.strictEqual(allowed.blocked, true);
    });

    it('rejects invalid targets', async () => {
      await noError(preview(OTHER_SITE, sheetRows(1, 2, 3)), 'invalid_reference');
      await noError(preview(SITE_LATE, sheetRows(1, 2, 3)), 'invalid_reference');
      await noError(preview(SITE_1, sheetRows(1, 2, 3), OWNER, '2026'), 'invalid_reference');
      await noError(preview(SITE_1, sheetRows(1, 2, 3), OWNER, '2027-03'), 'invalid_reference');
      await noError(preview(SITE_1, sheetRows(1, 2, 3), OWNER, 'garbage'), 'invalid_reference');
      await noError(preview(SITE_1, sheetRows(1, 2, 3), OWNER, PERIOD, uuid(9)), 'missing');
    });
  });

  describe('commit', () => {
    it('creates new documents with a valid shape', async () => {
      const {status, body} = await commit([{siteId: SITE_1, baseRev: null, values: values(1, 2, null)}]);
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body.results, [{siteId: SITE_1, status: 'created', rev: rev(2)}]);
      const doc = bulkCalls[0][0];
      assert.strictEqual(doc._id, idOf(SITE_1));
      assert.strictEqual(doc.type, 'input');
      assert.ok(!('_rev' in doc));
      assert.deepStrictEqual(doc.values, values(1, 2, null));
      assert.deepStrictEqual(doc.structure, structure);
      assert.ok(doc.updatedAt);
    });

    it('replaces with the file values, including blanks, and preserves the lock', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 2, 3), {blocked: true});
      const {status, body} = await commit([{siteId: SITE_1, baseRev: rev(1), values: values(5, null, 3)}]);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.results[0].status, 'updated');
      const doc = bulkCalls[0][0];
      assert.deepStrictEqual(doc.values, values(5, null, 3));
      assert.strictEqual(doc._rev, rev(1));
      assert.strictEqual(doc.blocked, true);
    });

    it('leaves sites which are not sent untouched', async () => {
      store[idOf(SITE_2)] = storedInput(SITE_2, values(1, 2, 3));
      await commit([{siteId: SITE_1, baseRev: null, values: values(1, 1, 1)}]);
      assert.deepStrictEqual(bulkCalls[0].map(doc => doc._id), [idOf(SITE_1)]);
    });

    it('skips unchanged documents', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 2, 3));
      const {status, body} = await commit([{siteId: SITE_1, baseRev: rev(1), values: values(1, 2, 3)}]);
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body.results, [{siteId: SITE_1, status: 'unchanged'}]);
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('writes nothing if a revision changed since the preview', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 2, 3), {_rev: rev(3)});
      const {status, body} = await commit([
        {siteId: SITE_1, baseRev: rev(1), values: values(5, 5, 5)},
        {siteId: SITE_2, baseRev: null, values: values(5, 5, 5)}
      ]);
      assert.strictEqual(status, 409);
      assert.strictEqual(body.key, 'import.error.conflict');
      assert.strictEqual(body.extra.sites, 'Site 1');
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('writes nothing if a site got data since the preview', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 2, 3));
      const {status} = await commit([{siteId: SITE_1, baseRev: null, values: values(5, 5, 5)}]);
      assert.strictEqual(status, 409);
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('writes nothing if the form changed since the preview', async () => {
      const {status} = await commit([{siteId: SITE_1, baseRev: null, values: values(5, 5, 5)}], OWNER, 'stale');
      assert.strictEqual(status, 409);
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('only clears a whole site when explicitly asked', async () => {
      store[idOf(SITE_1)] = storedInput(SITE_1, values(1, 2, 3));
      const refused = await commit([
        {siteId: SITE_1, baseRev: rev(1), values: values(null, null, null)},
        {siteId: SITE_2, baseRev: null, values: values(5, 5, 5)}
      ]);
      assert.strictEqual(refused.status, 400);
      assert.strictEqual(refused.body.key, 'import.error.clear-not-confirmed');
      assert.strictEqual(bulkCalls.length, 0);

      const {status} = await commit([{siteId: SITE_1, baseRev: rev(1), confirmClear: true, values: values(null, null, null)}]);
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(bulkCalls[0][0].values, values(null, null, null));
    });

    it('never creates an empty document', async () => {
      const {status, body} = await commit([{siteId: SITE_1, baseRev: null, confirmClear: true, values: values(null, null, null)}]);
      assert.strictEqual(status, 200);
      assert.strictEqual(body.results[0].status, 'unchanged');
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('rejects malformed requests', async () => {
      const site = {siteId: SITE_1, baseRev: null, values: values(1, 2, 3)};
      await noError(commit([]), 'invalid_data');
      await noError(commit([site, site]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: {[VAR_A]: [1]}}]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: Object.assign(values(1, 2, 3), {[uuid(8)]: [1]})}]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: values(1, 2)}]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: values(1.5, 2, 3)}]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: values(-1, 2, 3)}]), 'invalid_data');
      await noError(commit([{siteId: SITE_1, values: values('1', 2, 3)}]), 'invalid_data');
      await noError(commit([{siteId: OTHER_SITE, values: values(1, 2, 3)}]), 'invalid_reference');
      assert.strictEqual(bulkCalls.length, 0);
    });

    it('rejects the whole import on any permission failure', async () => {
      const mine = {siteId: SITE_1, baseRev: null, values: values(1, 2, 3)};
      const theirs = {siteId: SITE_2, baseRev: null, values: values(1, 2, 3)};
      const structureHash = await hash();
      await noError(commit([mine, theirs], INPUT_USER, structureHash), 'forbidden');
      await noError(commit([mine], READ_USER, structureHash), 'forbidden');

      store[idOf(SITE_1)] = storedInput(SITE_1, values(9, 9, 9), {blocked: true});
      await noError(commit([{siteId: SITE_1, baseRev: rev(1), values: values(1, 2, 3)}], INPUT_USER, structureHash), 'forbidden');
      assert.strictEqual(bulkCalls.length, 0);

      delete store[idOf(SITE_1)];
      assert.strictEqual((await commit([mine], INPUT_USER, structureHash)).status, 200);
    });

    it('restores written documents on partial failure: previous content, or deletion', async () => {
      const previous = storedInput(SITE_1, values(1, 2, 3), {blocked: true});
      store[idOf(SITE_1)] = previous;
      bulkImpl = (docs, call) => call > 1 ? docs.map(doc => ({id: doc._id, rev: rev(3)})) : [
        {id: idOf(SITE_1), rev: rev(2)},
        {id: idOf(SITE_2), rev: rev(2)},
        {id: idOf(SITE_LATE), error: 'forbidden'}
      ];
      projectDoc.entities[2].start = null;
      try {
        const {status, body} = await commit([
          {siteId: SITE_1, baseRev: rev(1), values: values(7, 7, 7)},
          {siteId: SITE_2, baseRev: null, values: values(7, 7, 7)},
          {siteId: SITE_LATE, baseRev: null, values: values(7, 7, 7)}
        ]);
        assert.strictEqual(status, 500);
        assert.strictEqual(body.key, 'import.error.rolled-back');
      }
      finally { projectDoc.entities[2].start = '2026-06-01'; }

      assert.strictEqual(bulkCalls.length, 2);
      const [restored, deleted] = bulkCalls[1];
      assert.deepStrictEqual(restored, Object.assign({}, previous, {_rev: rev(2)}));
      assert.deepStrictEqual(deleted, {_id: idOf(SITE_2), _rev: rev(2), _deleted: true});
    });

    it('reports a concurrent write as a conflict, once restored', async () => {
      bulkImpl = (docs, call) => call > 1 ? docs.map(doc => ({id: doc._id, rev: rev(3)})) : [
        {id: idOf(SITE_1), rev: rev(2)},
        {id: idOf(SITE_2), error: 'conflict'}
      ];
      const {status, body} = await commit([
        {siteId: SITE_1, baseRev: null, values: values(7, 7, 7)},
        {siteId: SITE_2, baseRev: null, values: values(7, 7, 7)}
      ]);
      assert.strictEqual(status, 409);
      assert.strictEqual(body.extra.sites, 'Site 2');
      assert.strictEqual(bulkCalls.length, 2);
    });

    it('names the sites which could not be restored', async () => {
      bulkImpl = (docs, call) => call > 1 ? [{id: idOf(SITE_1), error: 'conflict'}] : [
        {id: idOf(SITE_1), rev: rev(2)},
        {id: idOf(SITE_2), error: 'forbidden'}
      ];
      const {status, body} = await commit([
        {siteId: SITE_1, baseRev: null, values: values(7, 7, 7)},
        {siteId: SITE_2, baseRev: null, values: values(7, 7, 7)}
      ]);
      assert.strictEqual(status, 500);
      assert.strictEqual(body.key, 'import.error.rollback-failed');
      assert.strictEqual(body.extra.sites, 'Site 1');
    });

    it('restores what a failed request wrote, found from its stamp', async () => {
      const previous = storedInput(SITE_1, values(1, 2, 3));
      store[idOf(SITE_1)] = previous;
      bulkImpl = (docs, call) => {
        if (call > 1) return docs.map(doc => ({id: doc._id, rev: rev(3)}));
        store[idOf(SITE_1)] = Object.assign({}, docs[0], {_rev: rev(2)});
        throw new Error('socket hang up');
      };
      const {status, body} = await commit([
        {siteId: SITE_1, baseRev: rev(1), values: values(7, 7, 7)},
        {siteId: SITE_2, baseRev: null, values: values(7, 7, 7)}
      ]);
      assert.strictEqual(status, 500);
      assert.strictEqual(body.key, 'import.error.rolled-back');
      assert.deepStrictEqual(bulkCalls[1], [Object.assign({}, previous, {_rev: rev(2)})]);
    });

    it('names all sites as unknown when a failed request cannot be checked', async () => {
      bulkImpl = () => {
        store[idOf(SITE_1)] = new Error('ECONNREFUSED');
        throw new Error('socket hang up');
      };
      const {status, body} = await commit([{siteId: SITE_1, baseRev: null, values: values(7, 7, 7)}]);
      assert.strictEqual(status, 500);
      assert.strictEqual(body.key, 'import.error.rollback-failed');
      assert.strictEqual(body.unknownState, true);
      assert.strictEqual(body.extra.sites, 'Site 1');
    });

    it('invalidates the inputs cache after writing', async () => {
      let invalidated = 0;
      const original = Project.storeInstance.invalidateInputsCache;
      Project.storeInstance.invalidateInputsCache = () => { invalidated++; };
      try {
        await commit([{siteId: SITE_1, baseRev: null, values: values(1, 2, 3)}]);
        assert.strictEqual(invalidated, 1);
        bulkImpl = () => { store[idOf(SITE_1)] = new Error('x'); throw new Error('y'); };
        await commit([{siteId: SITE_1, baseRev: null, values: values(1, 2, 3)}]);
        assert.strictEqual(invalidated, 2);
      }
      finally { Project.storeInstance.invalidateInputsCache = original; }
    });
  });
});
