import { scopeOf } from '@deepseek-ai/dsh-scope';
import * as nativeMcp from '@deepseek-ai/dsh-mcp-client';
import { allowed, workspaceOf } from './policy.js';

export function createRuntime(ctx, store, discovery) {
  const skills = ctx.skills;
  const originalSnapshot = skills.snapshot, originalGet = skills.get;
  const active = new Map(); let closed = false, pending = Promise.resolve();
  const sourceAllowed = item => item.provider !== 'workspace-capabilities-filesystem' || store.state.discovery?.includeExternal === true;
  function lookup(options, receiver) { return workspaceOf(options.scope ?? scopeOf(receiver?.ctx ?? ctx), options.cwd); }
  function rowAllowed(row, workspace) {
    return (!row.external || store.state.discovery?.includeExternal === true) && allowed(store.state, 'mcp', row.id, workspace, row.workspace) &&
      (row.native || (!row.problem && store.state.approvals[row.id] === row.fingerprint));
  }
  function toolAllowed(name, workspace, args) {
    if (name.startsWith('mcp__')) {
      const matches = discovery.matching(name);
      return matches.length > 0 && matches.every(row => rowAllowed(row, workspace));
    }
    if (['list_mcp_resources', 'list_mcp_resource_templates', 'read_mcp_resource'].includes(name)) {
      const matches = [...discovery.rows.values()].filter(row => row.namespace === args?.server);
      return matches.length > 0 && matches.every(row => rowAllowed(row, workspace));
    }
    return true;
  }
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
  // Own only these instance wrappers. No installed DSH source is modified.
  skills.snapshot = snapshot; skills.get = get;
  ctx.effect(() => () => {
    if (skills.snapshot === snapshot) skills.snapshot = originalSnapshot;
    if (skills.get === get) skills.get = originalGet;
  }, 'capabilities: skill policy');
  ctx.tools.guard(exec => toolAllowed(exec.name, workspaceOf(exec.agent), exec.arguments)
    ? undefined : '此工作区的 Skill 与 MCP 设置已禁用该 MCP，或尚未批准连接。');

  ctx.inject(['systemPrompt'], child => {
    child.on('system-prompt/assemble', async (assembly, context, next) => {
      const result = await next(); const workspace = workspaceOf(context.scope);
      const allowedRows = [...discovery.rows.values()].filter(row => rowAllowed(row, workspace));
      return { ...result,
        tools: result.tools.filter(tool => {
          // Shared resource tools remain visible when at least one server is available.
          if (['list_mcp_resources', 'list_mcp_resource_templates', 'read_mcp_resource'].includes(tool.name)) return allowedRows.length > 0;
          return toolAllowed(tool.name, workspace);
        }),
        sections: result.sections.flatMap(section => {
          if (section.name.startsWith('mcp:')) {
            const name = section.name.slice(4);
            return allowedRows.some(row => row.namespace === name) ? [section] : [];
          }
          if (section.name === 'mcp-resource-servers') return allowedRows.length ? [{ ...section,
            text: 'Available MCP resource servers for this workspace: ' + JSON.stringify([...new Set(allowedRows.map(row => row.namespace))]) + '. Use these names as the server argument for MCP resource tools.' }] : [];
          return [section];
        })
      };
    });
  });
  const restrictions = new Map(); let queued = false;
  function updateRestrictions() {
    if (closed) return;
    for (const agent of ctx.get('agents')?.list() ?? []) {
      if (!agent.ctx || !agent.session) continue;
      const workspace = workspaceOf(agent);
      const denied = ctx.tools.schemas().map(tool => tool.name).filter(name => name.startsWith('mcp__') && !toolAllowed(name, workspace)).sort();
      const signature = JSON.stringify(denied), previous = restrictions.get(agent);
      if (previous?.signature === signature) continue;
      previous?.dispose();
      const dispose = denied.length ? agent.ctx.tools.restrict({ deny: denied }) : () => {};
      restrictions.set(agent, { signature, dispose });
    }
  }
  function scheduleRestrictions() {
    if (queued || closed) return; queued = true;
    queueMicrotask(() => { queued = false; updateRestrictions(); });
  }
  ctx.on('tools/change', scheduleRestrictions);
  ctx.on('agent/created', scheduleRestrictions);
  ctx.on('agent/disposed', ({ agent }) => { restrictions.get(agent)?.dispose(); restrictions.delete(agent); });
  async function reconcile() {
    if (closed) return;
    const workspaces = (await discovery.workspaces()).map(item => item.path);
    const desired = new Map([...discovery.rows.values()].filter(row => !row.native &&
      ['', ...workspaces].some(workspace => rowAllowed(row, workspace))).map(row => [row.id, row]));
    for (const [id, connection] of active) {
      const row = desired.get(id);
      if (!row || row.fingerprint !== connection.fingerprint) {
        active.delete(id); await connection.fiber.dispose();
      }
    }
    for (const [id, row] of desired) {
      if (active.has(id) || closed) continue;
      const connection = { fingerprint: row.fingerprint, status: 'connecting', fiber: null };
      const plugin = { name: 'workspace-mcp-' + id, inject: nativeMcp.inject,
        async apply(child) {
          try { await nativeMcp.apply(child, nativeMcp.Config(row.config)); connection.status = 'connected'; }
          catch { connection.status = 'error'; /* Native logs may contain credentials; API uses a fixed message. */ }
        }
      };
      connection.fiber = ctx.plugin(plugin); active.set(id, connection);
      // Activation runs independently: an unreachable MCP must not block the settings API.
      connection.fiber.await().catch(() => { connection.status = 'error'; });
    }
    scheduleRestrictions();
  }
  function sync() { pending = pending.then(reconcile, reconcile); return pending; }
  function changed() {
    scheduleRestrictions(); ctx.emit('skills/change'); ctx.emit('system-prompt/change');
    return sync();
  }
  ctx.effect(() => async () => {
    closed = true;
    for (const entry of restrictions.values()) entry.dispose(); restrictions.clear();
    await pending;
    await Promise.allSettled([...active.values()].map(entry => entry.fiber.dispose())); active.clear();
  }, 'capabilities: managed MCP lifecycle');
  return { originalSnapshot: async options => { const result = await originalSnapshot.call(skills, options); return { ...result, skills: result.skills.filter(sourceAllowed) }; }, rowAllowed, toolAllowed, changed, sync,
    connectionStatus(row) {
      const entry = active.get(row.id);
      if (row.native) return discovery.schemas().some(tool => tool.name.startsWith('mcp__' + row.namespace + '__')) ? 'native' : 'configured';
      if (!entry) return 'disconnected';
      if (entry.status === 'connected' && !discovery.schemas().some(tool => tool.name.startsWith('mcp__' + row.namespace + '__'))) return 'connected-no-tools';
      return entry.status;
    }
  };
}
