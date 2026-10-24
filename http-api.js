import { stat } from 'node:fs/promises';
import { canonical, allowed, PolicyError } from './policy.js';
import { publicMcp } from './discovery.js';
import { translationTargets } from './translations.js';

export const BASE = '/workspace-capabilities/v1';
const send = (response, status, value) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(value));
};
async function body(request) {
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > 65536) throw new PolicyError('请求超过 64 KiB。', 413); chunks.push(chunk); }
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; }
  catch { throw new PolicyError('请求不是有效的 JSON 对象。'); }
}
export function createApi(ctx, store, discovery, runtime, { syncSources, translations } = {}) {
  async function view(path = '', options = {}) {
    const workspace = canonical(path), state = store.state;
    const observation = await runtime.originalSnapshot(workspace ? { cwd: workspace } : {});
    const rules = workspace ? state.workspaces[workspace] ?? { skills: {}, mcp: {} } : state.global;
    const skills = observation.skills.map(item => ({ name: item.name, description: item.description, source: item.source,
      path: item.path ?? '', provider: item.provider, rule: rules.skills[item.name] ?? null,
      global: allowed(state, 'skills', item.name), enabled: allowed(state, 'skills', item.name, workspace), invocation: item.invocation }));
    const mcp = [...discovery.rows.values()].filter(row => !row.external || state.discovery.includeExternal).map(row => ({ ...publicMcp(row), rule: rules.mcp[row.id] ?? null,
      global: allowed(state, 'mcp', row.id, '', row.workspace), enabled: runtime.rowAllowed(row, workspace),
      requested: allowed(state, 'mcp', row.id, workspace, row.workspace), approved: row.native || state.approvals[row.id] === row.fingerprint,
      status: runtime.connectionStatus(row), tools: discovery.schemas().filter(tool => tool.name.startsWith('mcp__' + row.namespace + '__')).length,
      toolDetails: discovery.schemas().filter(tool => tool.name.startsWith('mcp__' + row.namespace + '__')).map(tool => ({ name: tool.name, description: tool.description ?? '' })) }));
    const translation = translations?.info(options) ?? { available: false, model: null };
    const result = { revision: state.revision, defaults: state.defaults, discovery: state.discovery, workspace, workspaces: await discovery.workspaces(),
      skills, mcp, translation, complete: observation.complete, scannedAt: discovery.scannedAt, issues: discovery.issues, error: store.error };
    const targets = new Map(translationTargets(result).map(item => [item.key, item]));
    for (const item of skills) item.translation = translations?.cached(targets.get('skill:' + item.name), translation.model) ?? null;
    for (const item of mcp) {
      item.translation = translations?.cached(targets.get('mcp:' + item.id), translation.model) ?? null;
      for (const tool of item.toolDetails) tool.translation = translations?.cached(targets.get('tool:' + tool.name), translation.model) ?? null;
    }
    return result;
  }
  async function action(data) {
    const workspace = data.workspace ? canonical(data.workspace) : '';
    if (data.workspace && !workspace) throw new PolicyError('工作区必须是绝对路径。');
    if (workspace) { try { if (!(await stat(workspace)).isDirectory()) throw new Error(); } catch { throw new PolicyError('工作区目录不存在或不可访问。'); } }
    if (data.action === 'refresh') { await discovery.scan(); await runtime.changed(); return view(workspace, data); }
    const known = await view(workspace);
    if (data.action === 'rule' || data.action === 'approve') {
      if (!['skills', 'mcp'].includes(data.kind)) throw new PolicyError('能力类型无效。');
      const item = known[data.kind].find(item => (data.kind === 'skills' ? item.name : item.id) === data.key);
      if (!item) throw new PolicyError('未发现此能力，请重新扫描。', 404);
      if (![true, false, null].includes(data.value)) throw new PolicyError('规则必须为启用、禁用或继承。');
      if (data.kind === 'mcp' && item.workspace && workspace !== item.workspace && data.value === true) throw new PolicyError('此 MCP 来源于另一工作区，仅能在来源工作区启用。');
    }
    if (data.action === 'approve') {
      if (data.kind !== 'mcp' || data.value !== true) throw new PolicyError('批准连接参数无效。');
      const old = discovery.rows.get(data.key);
      await discovery.scan();
      const current = discovery.rows.get(data.key);
      if (!current || old.fingerprint !== current.fingerprint || data.fingerprint !== current.fingerprint) throw new PolicyError('源配置已改变，请重新检查并批准。', 409);
      if (current.problem) throw new PolicyError(current.problem);
    }
    await store.update(data.revision, next => {
      if (data.action === 'discovery') {
        if (typeof data.value !== 'boolean') throw new PolicyError('发现来源开关无效。');
        next.discovery.includeExternal = data.value; return;
      }
      if (data.action === 'workspace') {
        if (!workspace) throw new PolicyError('请选择工作区。');
        next.workspaces[workspace] ??= { skills: {}, mcp: {} }; return;
      }
      if (data.action === 'defaults') {
        if (!['skills', 'mcp'].includes(data.kind) || typeof data.value !== 'boolean' || workspace) throw new PolicyError('默认规则无效。');
        next.defaults[data.kind] = data.value; return;
      }
      if (!['rule', 'approve'].includes(data.action)) throw new PolicyError('操作无效。');
      const container = workspace ? next.workspaces[workspace] ??= { skills: {}, mcp: {} } : next.global;
      if (data.value === null) delete container[data.kind][data.key]; else container[data.kind][data.key] = data.value;
      if (data.action === 'approve') next.approvals[data.key] = discovery.rows.get(data.key).fingerprint;
    });
    if (data.action === 'discovery' && syncSources) await syncSources();
    else await runtime.changed();
    return view(workspace, data);
  }
  async function translate(data, signal) {
    if (!translations) throw new PolicyError('翻译服务尚未就绪。', 503);
    if (data.force !== undefined && typeof data.force !== 'boolean') throw new PolicyError('重新翻译参数无效。');
    if (!Array.isArray(data.keys) || data.keys.length < 1 || data.keys.length > 12 || data.keys.some(key => typeof key !== 'string') || new Set(data.keys).size !== data.keys.length) throw new PolicyError('每次请选择 1–12 条说明。');
    const current = await view(data.workspace ?? '', data), targets = translationTargets(current);
    const items = data.keys.map(key => targets.find(item => item.key === key));
    if (items.some(item => !item)) throw new PolicyError('该能力已不在当前发现范围，请刷新后重试。', 404);
    const result = await translations.translate(items, { ...data, signal });
    return { ...result, view: await view(data.workspace ?? '', data) };
  }
  async function handler(request, response) {
    const rejection = ctx.connection.requestRejection(request);
    if (rejection !== undefined) return send(response, rejection, { error: '请使用受信任的 Harness 页面访问设置。' });
    const controller = new AbortController();
    const abort = () => { if (!response.writableEnded) controller.abort(); };
    request.once('aborted', abort); response.once('close', abort);
    try {
      const url = new URL(request.url, 'http://local');
      const options = { sessionId: url.searchParams.get('sessionId') ?? undefined,
        ...(url.searchParams.has('provider') ? { selection: { provider: url.searchParams.get('provider'), model: url.searchParams.get('model') } } : {}) };
      if (request.method === 'GET' && url.pathname === BASE + '/state') return send(response, 200, await view(url.searchParams.get('workspace') ?? '', options));
      if (request.method !== 'POST' || ![BASE + '/action', BASE + '/translate'].includes(url.pathname)) return send(response, 404, { error: '接口不存在。' });
      if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) throw new PolicyError('请求必须使用 application/json。', 415);
      const data = await body(request);
      return send(response, 200, url.pathname === BASE + '/translate' ? await translate(data, controller.signal) : await action(data));
    } catch (error) { return send(response, error.status ?? 500, { error: error instanceof PolicyError ? error.message : '操作未完成，请刷新后重试。' }); }
    finally { request.off('aborted', abort); response.off('close', abort); }
  }
  return { view, action, translate, handler };
}
