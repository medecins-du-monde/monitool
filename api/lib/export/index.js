import database from '../resource/database';
import config from '../config/config';
import ExportCache from './cache';
import createSynchronizer from './synchronize';
import {changes, projectForDocument} from './changes';

const synchronize = createSynchronizer(database.database, id => changes.emit('changed', id));

const cache = new ExportCache(Object.assign({}, config.exportCache, {synchronize}));
changes.on('changed', id => {
  const projectId = projectForDocument(id);
  if (projectId) cache.invalidate(projectId);
  else if (/^(indicator|theme):/.test(id)) cache.invalidate();
});

const cleanupTimer = setInterval(() => {
  cache.ready().then(() => cache.cleanup()).catch(error => console.error('Export cache cleanup failed:', error.message));
}, 60000);
cleanupTimer.unref();

export default cache;
