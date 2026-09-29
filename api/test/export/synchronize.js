import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ExportCache from '../../lib/export/cache';
import createSynchronizer from '../../lib/export/synchronize';
import {projectForDocument} from '../../lib/export/changes';

describe('Export cache change checkpoints', () => {
  let directory, history, cache, database;
  function restart() {
    const synchronize = createSynchronizer(database, id => cache.invalidate(projectForDocument(id)));
    cache = new ExportCache({directory, synchronize});
  }
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monitool-changes-test-'));
    history = [];
    database = {
      info: async () => ({update_seq: history.length}),
      changes: async ({since}) => ({results: history.slice(since), last_seq: history.length, pending: 0})
    };
    restart();
  });
  afterEach(() => {
    fs.readdirSync(directory).forEach(file => fs.unlinkSync(path.join(directory, file)));
    fs.rmdirSync(directory);
  });
  const write = async filename => fs.writeFileSync(filename, 'workbook');

  it('reuses persisted files when the source has not changed', async () => {
    await cache.getOrGenerate('project:1', {}, write);
    restart();
    assert(await cache.lookup('project:1', {}));
  });

  it('replays offline input edits and deletes only the affected project files', async () => {
    await cache.getOrGenerate('project:1', {}, write);
    await cache.getOrGenerate('project:2', {}, write);
    history.push({id: 'input:project:1:form:site:2026-01'});
    restart();
    assert.strictEqual(await cache.lookup('project:1', {}), null);
    assert(await cache.lookup('project:2', {}));
    assert.strictEqual(fs.readdirSync(directory).filter(file => file.endsWith('.xlsx')).length, 1);
  });

  it('rejects generation when the change feed reports a concurrent source edit', async () => {
    let rejected = false;
    try {
      await cache.getOrGenerate('project:1', {}, async filename => {
        await write(filename);
        history.push({id: 'project:1'});
      });
    } catch (error) { rejected = true; assert.strictEqual(error.status, 409); }
    assert(rejected);
    assert.strictEqual(cache.entries.size, 0);
  });

  it('discards files with no trustworthy checkpoint', async () => {
    await cache.getOrGenerate('project:1', {}, write);
    fs.unlinkSync(path.join(directory, 'checkpoint.json'));
    restart();
    assert.strictEqual(await cache.lookup('project:1', {}), null);
  });

  it('does not serve cached data when freshness cannot be checked', async () => {
    await cache.getOrGenerate('project:1', {}, write);
    database.changes = async () => { throw new Error('Database unavailable'); };
    try {
      await cache.lookup('project:1', {});
      assert.fail('Expected freshness check to fail');
    } catch (error) { assert.strictEqual(error.message, 'Database unavailable'); }
  });
});
