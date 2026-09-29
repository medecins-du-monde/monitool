import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ExportCache from '../../lib/export/cache';
import {projectCriteria, normalizeFilters, intersectFilters} from '../../lib/export/criteria';
import {changes, reportVersion, projectForDocument} from '../../lib/export/changes';

describe('General Report export cache', () => {
  let directory, cache, now, generations;
  const criteria = {type: 'global', language: 'en', periodicity: 'month', filters: {}};
  const write = async filename => { generations++; fs.writeFileSync(filename, 'workbook'); };
  const download = entry => new Promise((resolve, reject) => {
    const stream = cache.stream(entry);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.resume();
  });
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monitool-cache-test-'));
    now = 1000;
    generations = 0;
    cache = new ExportCache({directory, now: () => now, maxFiles: 2, ttlMs: 100});
  });
  afterEach(() => {
    fs.readdirSync(directory).forEach(file => fs.unlinkSync(path.join(directory, file)));
    fs.rmdirSync(directory);
  });

  it('generates once and reuses identical criteria, including reordered filter selections', async () => {
    const first = Object.assign({}, criteria, {filters: normalizeFilters({entity: ['b', 'a', 'a']})});
    const second = Object.assign({}, criteria, {filters: normalizeFilters({entity: ['a', 'b']})});
    assert.strictEqual((await cache.getOrGenerate('project:1', first, write)).cached, false);
    assert.strictEqual((await cache.getOrGenerate('project:1', second, write)).cached, true);
    assert.strictEqual(generations, 1);
    assert.strictEqual(cache.entries.size, 1);
  });

  it('separates project, type, language, periodicity, dates, sites and snapshot layout', () => {
    const variations = [criteria,
      Object.assign({}, criteria, {type: 'detailed'}),
      Object.assign({}, criteria, {language: 'fr'}),
      Object.assign({}, criteria, {periodicity: 'year'}),
      Object.assign({}, criteria, {filters: {entity: ['a']}}),
      Object.assign({}, criteria, {filters: {_start: '2026-01-01', _end: '2026-02-01'}}),
      Object.assign({}, criteria, {content: 'expanded'})];
    assert.strictEqual(new Set(variations.map(value => cache.key('project:1', value))).size, variations.length);
    assert.notStrictEqual(cache.key('project:1', criteria), cache.key('project:2', criteria));
  });

  it('deduplicates concurrent generation without publishing an incomplete file', async () => {
    let release, started;
    const waiting = new Promise(resolve => { release = resolve; });
    const entered = new Promise(resolve => { started = resolve; });
    const generate = async filename => { started(); await waiting; await write(filename); };
    const first = cache.getOrGenerate('project:1', criteria, generate);
    await entered;
    const second = cache.getOrGenerate('project:1', criteria, generate);
    assert.strictEqual(await cache.lookup('project:1', criteria), null);
    release();
    const results = await Promise.all([first, second]);
    assert.strictEqual(generations, 1);
    assert.strictEqual(results[0].entry.filename, results[1].entry.filename);
  });

  it('evicts the least recently downloaded file and preserves recently downloaded older files', async () => {
    const first = await cache.getOrGenerate('project:1', {n: 1}, write);
    await download(first.entry);
    now++;
    const second = await cache.getOrGenerate('project:1', {n: 2}, write);
    await download(second.entry);
    await cache.getOrGenerate('project:2', {n: 1}, write);
    now++;
    await download(first.entry);
    now++;
    await cache.getOrGenerate('project:1', {n: 3}, write);
    assert(await cache.lookup('project:1', {n: 1}));
    assert.strictEqual(await cache.lookup('project:1', {n: 2}), null);
    assert(!fs.existsSync(second.entry.filename));
    assert(await cache.lookup('project:2', {n: 1}));
  });

  it('does not count status lookups or generation cache hits as downloads', async () => {
    const first = await cache.getOrGenerate('project:1', {n: 1}, write);
    await download(first.entry);
    now++;
    const second = await cache.getOrGenerate('project:1', {n: 2}, write);
    await download(second.entry);
    now++;
    await cache.lookup('project:1', {n: 1});
    await cache.getOrGenerate('project:1', {n: 1}, write);
    now++;
    await cache.getOrGenerate('project:1', {n: 3}, write);
    assert.strictEqual(await cache.lookup('project:1', {n: 1}), null);
    assert(!fs.existsSync(first.entry.filename));
    assert(await cache.lookup('project:1', {n: 2}));
  });

  it('expires files from generation time even after a recent download and regenerates them', async () => {
    const result = await cache.getOrGenerate('project:1', criteria, write);
    now += 90;
    await download(result.entry);
    now += 10;
    assert.strictEqual(await cache.lookup('project:1', criteria), null);
    await cache.getOrGenerate('project:1', criteria, write);
    assert.strictEqual(generations, 2);
  });

  it('invalidates every variant for one project without removing other projects', async () => {
    await cache.getOrGenerate('project:1', criteria, write);
    await cache.getOrGenerate('project:1', {type: 'current-view'}, write);
    await cache.getOrGenerate('project:2', criteria, write);
    cache.invalidate('project:1');
    assert.strictEqual(cache.entries.size, 1);
    assert(await cache.lookup('project:2', criteria));
  });

  it('does not publish a job invalidated while it was being generated', async () => {
    let rejected = false;
    try {
      await cache.getOrGenerate('project:1', criteria, async filename => {
        await write(filename);
        cache.invalidate('project:1');
      });
    } catch (error) { rejected = true; assert.strictEqual(error.status, 409); }
    assert(rejected);
    assert.strictEqual(cache.entries.size, 0);
    assert.deepStrictEqual(fs.readdirSync(directory), []);
    await cache.getOrGenerate('project:1', criteria, write);
    assert.strictEqual(generations, 2);
  });

  it('removes partial output after failure and permits retry', async () => {
    try {
      await cache.getOrGenerate('project:1', criteria, async filename => {
        await write(filename);
        throw new Error('Generation failed');
      });
      assert.fail('Expected failure');
    } catch (error) { assert.strictEqual(error.message, 'Generation failed'); }
    assert.deepStrictEqual(fs.readdirSync(directory), []);
    await cache.getOrGenerate('project:1', criteria, write);
    assert.strictEqual(generations, 2);
  });

  it('recovers completed files after restart and removes abandoned temporary files', async () => {
    await cache.getOrGenerate('project:1', criteria, write);
    const orphan = cache.key('project:1', criteria) + '.interrupted.temp';
    fs.writeFileSync(path.join(directory, orphan), 'partial');
    const restarted = new ExportCache({directory, now: () => now});
    assert.strictEqual((await restarted.getOrGenerate('project:1', criteria, write)).cached, true);
    assert.strictEqual(generations, 1);
    assert(!fs.existsSync(path.join(directory, orphan)));
  });

  it('preserves download-based eviction order after restart', async () => {
    const first = await cache.getOrGenerate('project:1', {n: 1}, write);
    now++;
    const second = await cache.getOrGenerate('project:1', {n: 2}, write);
    await download(second.entry);
    now++;
    await download(first.entry);
    cache = new ExportCache({directory, now: () => now, maxFiles: 2});
    const recovered = await cache.lookup('project:1', {n: 1});
    assert.strictEqual(recovered.lastDownloadedAt, now);
    now++;
    await cache.getOrGenerate('project:1', {n: 3}, write);
    assert(await cache.lookup('project:1', {n: 1}));
    assert.strictEqual(await cache.lookup('project:1', {n: 2}), null);
  });

  it('uses generation time for legacy entries and files never downloaded', async () => {
    const first = await cache.getOrGenerate('project:1', {n: 1}, write);
    const metadata = path.join(directory, first.entry.key + '.json');
    const legacy = JSON.parse(fs.readFileSync(metadata, 'utf8'));
    delete legacy.lastDownloadedAt;
    fs.writeFileSync(metadata, JSON.stringify(legacy));
    now++;
    await cache.getOrGenerate('project:1', {n: 2}, write);
    cache = new ExportCache({directory, now: () => now, maxFiles: 2});
    now++;
    await cache.getOrGenerate('project:1', {n: 3}, write);
    assert.strictEqual(await cache.lookup('project:1', {n: 1}), null);
    assert(await cache.lookup('project:1', {n: 2}));
  });

  it('treats a missing workbook as a miss', async () => {
    const result = await cache.getOrGenerate('project:1', criteria, write);
    fs.unlinkSync(result.entry.filename);
    await cache.getOrGenerate('project:1', criteria, write);
    assert.strictEqual(generations, 2);
  });

  it('keeps an already-open download readable during eviction', async () => {
    const result = await cache.getOrGenerate('project:1', criteria, write);
    const stream = cache.stream(result.entry);
    cache.invalidate('project:1');
    const text = await new Promise((resolve, reject) => {
      let output = '';
      stream.on('data', data => { output += data; });
      stream.on('end', () => resolve(output));
      stream.on('error', reject);
    });
    assert.strictEqual(text, 'workbook');
  });

  it('enforces the optional global byte limit by last download across projects', async () => {
    cache.maxBytes = 16;
    const first = await cache.getOrGenerate('project:1', criteria, write);
    now++;
    const second = await cache.getOrGenerate('project:2', criteria, write);
    await download(second.entry);
    now++;
    await download(first.entry);
    now++;
    await cache.getOrGenerate('project:3', criteria, write);
    assert.strictEqual(cache.entries.size, 2);
    assert(await cache.lookup('project:1', criteria));
    assert.strictEqual(await cache.lookup('project:2', criteria), null);
  });

  it('normalizes booleans and rejects malformed filters', () => {
    const params = {periodicity: 'month', lang: 'en', minimized: 'false'};
    assert.strictEqual(projectCriteria(params, {}).type, 'detailed');
    assert.throws(() => projectCriteria(params, {filters: '{'}));
    assert.throws(() => normalizeFilters({_start: '2026-02-30', _end: '2026-03-01'}));
    assert.throws(() => normalizeFilters({entity: 'site'}));
    assert.throws(() => normalizeFilters({unknown: true}));
    assert.deepStrictEqual(intersectFilters(
      {_start: '2026-01-01', _end: '2026-12-31', entity: ['a', 'b']},
      {_start: '2026-03-01', _end: '2026-04-30', entity: ['b', 'c']}
    ), {_start: '2026-03-01', _end: '2026-04-30', entity: ['b']});
  });

  it('changes calculation versions for input/project changes and shared definitions', () => {
    assert.strictEqual(projectForDocument('input:project:1:form:site:period'), 'project:1');
    const before = reportVersion('project:1');
    changes.emit('changed', 'input:project:1:form:site:period');
    assert.notStrictEqual(reportVersion('project:1'), before);
    const other = reportVersion('project:2');
    changes.emit('changed', 'indicator:1');
    assert.notStrictEqual(reportVersion('project:2'), other);
  });
});
