import fs from 'fs';
import path from 'path';

export default function createSynchronizer(database, onChanged) {
  let synchronization;
  let cursor;
  let loaded = false;

  return async function synchronize(cache) {
    if (synchronization) return synchronization;
    synchronization = (async () => {
      const checkpoint = path.join(cache.directory, 'checkpoint.json');
      if (!loaded) {
        try { cursor = JSON.parse(fs.readFileSync(checkpoint, 'utf8')).sequence; }
        catch (error) { cursor = undefined; }
        if (cursor === undefined) {
          // Without a checkpoint, freshness of persisted files cannot be established.
          cache.invalidate();
          cursor = (await database.info()).update_seq;
        }
        loaded = true;
      }
      // Replay changes since the previous access, including writes while the API was down.
      let page;
      do {
        page = await database.changes({since: cursor, limit: 500});
        page.results.forEach(change => onChanged(change.id));
        cursor = page.last_seq;
      } while (page.pending > 0 || page.results.length === 500);
      fs.writeFileSync(checkpoint + '.temp', JSON.stringify({sequence: cursor}));
      fs.renameSync(checkpoint + '.temp', checkpoint);
    })();
    try { await synchronization; }
    finally { synchronization = null; }
  };
}
