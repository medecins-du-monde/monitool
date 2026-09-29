import {EventEmitter} from 'events';

export const changes = new EventEmitter();
const versions = new Map();
let sharedVersion = 0;

export function projectForDocument(id) {
  if (id.startsWith('project:')) return id;
  if (id.startsWith('input:project:')) return id.split(':').slice(1, 3).join(':');
  return null;
}

export function reportVersion(projectId) {
  return `${sharedVersion}:${versions.get(projectId) || 0}`;
}

changes.on('changed', id => {
  const projectId = projectForDocument(id);
  if (projectId) versions.set(projectId, (versions.get(projectId) || 0) + 1);
  else if (/^(indicator|theme):/.test(id)) sharedVersion++;
});
