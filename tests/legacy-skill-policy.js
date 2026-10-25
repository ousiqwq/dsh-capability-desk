import { scopeOf } from '@deepseek-ai/dsh-scope';
import { allowed, workspaceOf } from '../policy.js';

// Frozen v1.2.1 hooks: the live-upgrade test must exercise the published bug.
export function installLegacySkillPolicy(ctx, store) {
  const skills = ctx.skills;
  const originalSnapshot = skills.snapshot, originalGet = skills.get;
  const sourceAllowed = item => item.provider !== 'workspace-capabilities-filesystem' || store.state.discovery?.includeExternal === true;
  function lookup(options, receiver) { return workspaceOf(options.scope ?? scopeOf(receiver?.ctx ?? ctx), options.cwd); }
  async function snapshot(options = {}) {
    const result = await originalSnapshot.call(this, options);
    const workspace = lookup(options, this);
    return { ...result, skills: result.skills.filter(item => sourceAllowed(item) && allowed(store.state, 'skills', item.name, workspace)) };
  }
  async function get(name, options = {}) {
    const workspace = lookup(options, this);
    if (!allowed(store.state, 'skills', name, workspace)) return undefined;
    const skill = await originalGet.call(this, name, options);
    return skill && sourceAllowed(skill) && allowed(store.state, 'skills', name, workspace) ? skill : undefined;
  }
  skills.snapshot = snapshot; skills.get = get;
  ctx.effect(() => () => {
    if (skills.snapshot === snapshot) skills.snapshot = originalSnapshot;
    if (skills.get === get) skills.get = originalGet;
  }, 'legacy policy');
}
