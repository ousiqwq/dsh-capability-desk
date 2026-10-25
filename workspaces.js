import { canonical } from './policy.js';

// Directory identity controls policy; the registry owns the editable display title.
export function collectWorkspaces({ cwd, registered = [], agents = [], rules = {} }) {
  const entries = new Map();
  const add = (path, title) => {
    path = canonical(path);
    if (!path) return;
    entries.set(path, { path, title: title || entries.get(path)?.title || path.split('/').at(-1) || path });
  };
  add(cwd);
  for (const agent of agents) add(agent.session?.header?.cwd);
  for (const path of Object.keys(rules)) add(path);
  for (const item of registered) add(item.path, item.title);
  return [...entries.values()].sort((a, b) => a.path.localeCompare(b.path));
}
