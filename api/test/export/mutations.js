import assert from 'assert';
import {changes} from '../../lib/export/changes';

describe('Export invalidation on database writes', () => {
  let database, originalClient, originalConfig, events;
  const listener = id => events.push(id);
  before(() => {
    // Test the actual database wrapper without credentials or a live CouchDB.
    const configId = require.resolve('../../lib/config/config');
    originalConfig = require.cache[configId];
    require.cache[configId] = {id: configId, filename: configId, loaded: true,
      exports: {__esModule: true, default: {couchdb: {host: 'localhost'}}}};
    database = require('../../lib/resource/database').default;
    originalClient = database.database;
  });
  beforeEach(() => {
    events = [];
    changes.on('changed', listener);
    database.database = {
      insert: async doc => ({id: doc._id, rev: '2-new'}),
      destroy: async id => ({id, ok: true}),
      bulk: async ({docs}) => docs.map(doc => ({id: doc._id, rev: '2-new'}))
    };
  });
  afterEach(() => changes.removeListener('changed', listener));
  after(() => {
    database.database = originalClient;
    const configId = require.resolve('../../lib/config/config');
    if (originalConfig) require.cache[configId] = originalConfig;
    else delete require.cache[configId];
    delete require.cache[require.resolve('../../lib/resource/database')];
  });

  it('notifies after successful project and input saves and input deletion', async () => {
    await database.insert({_id: 'project:1'});
    await database.insert({_id: 'input:project:1:form:site:period'});
    await database.destroy('input:project:1:form:site:period', '2-new');
    assert.deepStrictEqual(events, ['project:1', 'input:project:1:form:site:period', 'input:project:1:form:site:period']);
  });

  it('notifies only successful documents in a partially failed bulk operation', async () => {
    database.database.bulk = async () => [{id: 'input:project:1:a', rev: '2-new'},
      {id: 'input:project:2:b', error: 'conflict'}];
    await database.callBulk({docs: []});
    assert.deepStrictEqual(events, ['input:project:1:a']);
  });

  it('does not notify for a rejected write', async () => {
    database.database.insert = async () => { throw new Error('conflict'); };
    try { await database.insert({_id: 'project:1'}); assert.fail('Expected conflict'); }
    catch (error) { assert.strictEqual(error.message, 'conflict'); }
    assert.deepStrictEqual(events, []);
  });
});
