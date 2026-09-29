import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Object key order is irrelevant; array order is preserved (worksheet rows/columns).
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    const result = Object.create(null);
    Object.keys(value).sort().forEach(key => {
      if (value[key] !== undefined) result[key] = canonical(value[key]);
    });
    return result;
  }
  return value;
}

export function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export default class ExportCache {
  constructor({directory, maxFiles = 10, ttlMs = 86400000, maxBytes = 0,
    now = Date.now, synchronize = async () => {}}) {
    Object.assign(this, {directory, maxFiles, ttlMs, maxBytes, now, synchronize});
    this.entries = new Map();
    this.jobs = new Map();
    this.versions = new Map();
    this.globalVersion = 0;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    fs.mkdirSync(this.directory, {recursive: true});
    for (const name of fs.readdirSync(this.directory)) {
      if (!/^[a-f0-9]{64}\.json$/.test(name)) continue;
      try {
        const entry = JSON.parse(fs.readFileSync(path.join(this.directory, name), 'utf8'));
        if (entry.key + '.json' !== name || typeof entry.projectId !== 'string' ||
            !Number.isFinite(entry.generatedAt) || !Number.isFinite(entry.expiresAt) ||
            (entry.lastDownloadedAt != null && !Number.isFinite(entry.lastDownloadedAt)) ||
            !Number.isFinite(entry.size)) throw new Error('Invalid cache metadata');
        entry.filename = path.join(this.directory, entry.key + '.xlsx');
        this.entries.set(entry.key, entry);
      } catch (error) {
        fs.unlinkSync(path.join(this.directory, name));
      }
    }
    // Interrupted writes are never downloadable. Only this API process owns the volume.
    for (const name of fs.readdirSync(this.directory)) {
      if (/^[a-f0-9]{64}.*\.temp$/.test(name) ||
          (/^[a-f0-9]{64}\.xlsx$/.test(name) && !this.entries.has(name.slice(0, 64)))) {
        fs.unlinkSync(path.join(this.directory, name));
      }
    }
    this.cleanup();
    this.initialized = true;
  }

  key(projectId, criteria) { return digest({schema: 1, projectId, criteria}); }
  version(projectId) { return `${this.globalVersion}:${this.versions.get(projectId) || 0}`; }

  remove(entry) {
    // Remove metadata first: interrupted deletion must never resurrect an entry.
    for (const file of [path.join(this.directory, entry.key + '.json'), entry.filename]) {
      try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    this.entries.delete(entry.key);
  }

  invalidate(projectId) {
    if (projectId) this.versions.set(projectId, (this.versions.get(projectId) || 0) + 1);
    else this.globalVersion++;
    for (const entry of this.entries.values()) {
      if (!projectId || entry.projectId === projectId) this.remove(entry);
    }
  }

  cleanup() {
    for (const entry of this.entries.values()) {
      if (entry.expiresAt <= this.now() || !fs.existsSync(entry.filename)) this.remove(entry);
    }
    // New and legacy entries use generation time until their first download.
    const lastUsed = entry => Number.isFinite(entry.lastDownloadedAt) ? entry.lastDownloadedAt : entry.generatedAt;
    const oldest = [...this.entries.values()].sort((a, b) =>
      lastUsed(a) - lastUsed(b) || a.generatedAt - b.generatedAt
    );
    const counts = new Map();
    let bytes = oldest.reduce((sum, entry) => sum + entry.size, 0);
    oldest.forEach(entry => counts.set(entry.projectId, (counts.get(entry.projectId) || 0) + 1));
    for (const entry of oldest) {
      if (counts.get(entry.projectId) > this.maxFiles || (this.maxBytes && bytes > this.maxBytes)) {
        this.remove(entry);
        counts.set(entry.projectId, counts.get(entry.projectId) - 1);
        bytes -= entry.size;
      }
    }
  }

  async ready() {
    this.initialize();
    await this.synchronize(this);
  }

  getEntry(key) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    let valid = entry.expiresAt > this.now();
    try { valid = valid && fs.statSync(entry.filename).size === entry.size; }
    catch (error) { if (error.code !== 'ENOENT') throw error; valid = false; }
    if (!valid) { this.remove(entry); return null; }
    return entry;
  }

  async lookup(projectId, criteria) {
    await this.ready();
    return this.getEntry(this.key(projectId, criteria));
  }

  async getOrGenerate(projectId, criteria, generate) {
    await this.ready();
    const key = this.key(projectId, criteria);
    const entry = this.getEntry(key);
    if (entry) return {entry, cached: true};
    const version = this.version(projectId);
    const jobKey = `${key}:${version}`;
    if (this.jobs.has(jobKey)) return this.jobs.get(jobKey);
    const job = this.generate(projectId, key, version, generate);
    this.jobs.set(jobKey, job);
    try { return await job; }
    finally { if (this.jobs.get(jobKey) === job) this.jobs.delete(jobKey); }
  }

  async generate(projectId, key, version, generate) {
    const filename = path.join(this.directory, key + '.xlsx');
    const temporary = path.join(this.directory, `${key}.${crypto.randomBytes(8).toString('hex')}.temp`);
    let published = false;
    try {
      await generate(temporary);
      await this.synchronize(this);
      if (this.version(projectId) !== version) {
        const error = new Error('Project changed during export; please retry');
        error.status = 409;
        throw error;
      }
      const generatedAt = this.now();
      const entry = {key, projectId, filename, generatedAt, lastDownloadedAt: null,
        expiresAt: generatedAt + this.ttlMs, size: fs.statSync(temporary).size};
      if (this.maxBytes && entry.size > this.maxBytes) {
        const error = new Error('Export exceeds the configured global cache size');
        error.status = 507;
        throw error;
      }
      fs.renameSync(temporary, filename);
      published = true;
      this.writeMetadata(entry);
      this.entries.set(key, entry);
      this.cleanup();
      return {entry, cached: false};
    } catch (error) {
      if (published) this.remove({key, filename});
      throw error;
    } finally {
      for (const file of [temporary, temporary + '.temp']) {
        try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
  }

  writeMetadata(entry) {
    const filename = path.join(this.directory, entry.key + '.json');
    try {
      fs.writeFileSync(filename + '.temp', JSON.stringify(entry));
      fs.renameSync(filename + '.temp', filename);
    } finally {
      try { fs.unlinkSync(filename + '.temp'); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }

  stream(entry) {
    // Pin the inode before yielding, so eviction cannot interrupt this download.
    const fd = fs.openSync(entry.filename, 'r');
    try {
      // Count actual download requests, not status polling or cache lookups.
      const updated = Object.assign({}, entry, {lastDownloadedAt: this.now()});
      this.writeMetadata(updated);
      entry.lastDownloadedAt = updated.lastDownloadedAt;
      return fs.createReadStream(entry.filename, {fd, autoClose: true});
    } catch (error) {
      fs.closeSync(fd);
      throw error;
    }
  }
}
