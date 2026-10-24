import { readFile, stat } from 'node:fs/promises';
import { join, dirname, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { parse as parseToml } from 'smol-toml';
import { parseDocument } from 'yaml';
import { canonical } from './policy.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const strings = value => object(value) && Object.entries(value).every(([k, v]) => typeof k === 'string' && typeof v === 'string');
function envValue(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{(?:env:)?([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => process.env[key] ?? '${env:' + key + '}');
}
function resolveValues(value) {
  if (typeof value === 'string') return envValue(value);
  if (Array.isArray(value)) return value.map(resolveValues);
  if (object(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveValues(v)]));
  return value;
}
export function redactEndpoint(value) {
  try { const url = new URL(value); url.username = ''; url.password = ''; url.search = ''; url.hash = ''; return url.toString(); }
  catch { return '(无效地址)'; }
}
export function publicMcp(row) {
  return { id: row.id, name: row.name, description: row.description ?? '', source: row.source, workspace: row.workspace, native: row.native,
    namespace: row.namespace, transport: row.config?.transport ?? 'native',
    launch: row.config?.transport === 'stdio' ? row.config.command : row.config?.url ? redactEndpoint(row.config.url) : '由 DSH 原生配置连接',
    envNames: Object.keys(row.config?.env ?? {}), valid: !row.problem, problem: row.problem ?? '', fingerprint: row.fingerprint };
}
export function normalizeMcp(name, raw, source, workspace = '', native = false) {
  const id = hash(source + '\0' + name).slice(0, 24);
  const namespace = native ? name : 'wc_' + id.slice(0, 12);
  let config, problem = '';
  try {
    if (!object(raw)) throw new Error('服务配置必须是对象。');
    const value = resolveValues(raw);
    if (value.disabled === true || value.enabled === false) throw new Error('源配置中已禁用，请先在源配置中启用。');
    if (value.type === 'sse' || value.transport === 'sse') throw new Error('此版本仅支持 stdio 和 Streamable HTTP。');
    if (typeof value.command === 'string' && value.command.trim()) {
      if (value.args !== undefined && (!Array.isArray(value.args) || !value.args.every(v => typeof v === 'string'))) throw new Error('args 必须是字符串数组。');
      if (value.env !== undefined && !strings(value.env)) throw new Error('env 必须是字符串字典。');
      const env = { ...(value.env ?? {}) };
      if (Array.isArray(value.env_vars)) for (const key of value.env_vars) if (typeof key === 'string' && process.env[key] !== undefined) env[key] = process.env[key];
      const cwd = value.cwd ? (isAbsolute(value.cwd) ? value.cwd : join(workspace || dirname(source), value.cwd)) : workspace || dirname(source);
      config = { transport: 'stdio', serverName: namespace, command: value.command, args: value.args ?? [], env, cwd };
    } else if (typeof value.url === 'string') {
      const url = new URL(value.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP 服务地址无效。');
      const headers = { ...(value.http_headers ?? value.headers ?? {}) };
      if (!strings(headers)) throw new Error('headers 必须是字符串字典。');
      if (object(value.env_http_headers)) for (const [key, env] of Object.entries(value.env_http_headers)) if (process.env[env]) headers[key] = process.env[env];
      if (typeof value.bearer_token_env_var === 'string' && process.env[value.bearer_token_env_var]) headers.Authorization = 'Bearer ' + process.env[value.bearer_token_env_var];
      config = { transport: 'streamable-http', serverName: namespace, url: url.toString(), headers };
    } else throw new Error('未发现 command 或 url。');
    if (JSON.stringify(config).includes('${env:')) throw new Error('DSH 服务环境中缺少配置引用的环境变量。');
    config.toolCallTimeoutMs = 60000; config.failOnStartupError = true;
    config.reconnect = { enabled: true, initialDelayMs: 1000, maxDelayMs: 30000, maxAttempts: 10 };
  } catch (error) { problem = error.message; }
  // Raw credentials never leave the backend; approval also invalidates on credential rotation.
  return { id, name, description: typeof raw?.description === 'string' ? raw.description.slice(0, 6000) : '', source, workspace: canonical(workspace), native, namespace, config, problem, fingerprint: hash(JSON.stringify({ raw, config, workspace })) };
}
function nativeEntries(value, output = []) {
  if (Array.isArray(value)) for (const item of value) nativeEntries(item, output);
  else if (object(value)) {
    if (value.name === '@deepseek-ai/dsh-mcp-client' && value.disabled !== true && typeof value.config?.serverName === 'string') output.push([value.config.serverName, value.config]);
    if (value.insert) nativeEntries(value.insert, output);
  }
  return output;
}
export class Discovery {
  constructor({ home, dshHome, snapshot, schemas, workspaces, includeExternal = () => false }) {
    Object.assign(this, { home, dshHome, snapshot, schemas, workspaces, includeExternal }); this.rows = new Map(); this.issues = []; this.scannedAt = null; this.scanPromise = null;
  }
  async sources() {
    const sources = [
      [join(this.dshHome, 'mcp.json'), 'json'],
      [join(this.dshHome, 'cordis.patch.yml'), 'yaml'], [join(this.dshHome, 'profiles/web/cordis.patch.yml'), 'yaml']
    ];
    const external = this.includeExternal();
    if (external) sources.push([join(this.home, '.codex/config.toml'), 'toml', '', true], [join(this.home, '.claude.json'), 'json', '', true],
      [join(this.home, '.claude/claude_desktop_config.json'), 'json', '', true], [join(this.home, '.config/Claude/claude_desktop_config.json'), 'json', '', true],
      [join(this.home, '.cursor/mcp.json'), 'json', '', true]);
    for (const workspace of await this.workspaces()) {
      sources.push([join(workspace.path, '.dsh/mcp.json'), 'json', workspace.path]);
      if (external) for (const [file, type] of [['.mcp.json', 'json'], ['.cursor/mcp.json', 'json'], ['.codex/config.toml', 'toml']]) sources.push([join(workspace.path, file), type, workspace.path, true]);
    }
    return sources;
  }
  scan() { return this.scanPromise ??= this.performScan().finally(() => { this.scanPromise = null; }); }
  async performScan() {
    const rows = new Map(), issues = [];
    for (const [source, type, workspace = '', external = false] of await this.sources()) {
      try {
        if ((await stat(source)).size > 2 * 1024 * 1024) throw new Error('文件超过 2 MiB，已跳过。');
        const text = await readFile(source, 'utf8');
        let value;
        if (type === 'toml') value = parseToml(text);
        else if (type === 'yaml') {
          const doc = parseDocument(text, { customTags: [{ tag: '!js', resolve: text => {
            const match = /^process\.env\.([A-Za-z_][A-Za-z0-9_]*)$/.exec(text.trim());
            return match ? '${env:' + match[1] + '}' : text;
          }}] });
          if (doc.errors.length) throw new Error('YAML 解析失败。'); value = doc.toJS();
        } else value = JSON.parse(text);
        const entries = type === 'yaml' ? nativeEntries(value) : Object.entries(value.mcpServers ?? value.mcp_servers ?? {});
        for (const [name, config] of entries) {
          const row = normalizeMcp(name, config, source, workspace, type === 'yaml'); row.external = external; rows.set(row.id, row);
        }
        // Claude Code can keep per-project MCP definitions in its user JSON file.
        if (source === join(this.home, '.claude.json') && object(value.projects)) for (const [path, project] of Object.entries(value.projects)) {
          for (const [name, config] of Object.entries(project.mcpServers ?? {})) {
            const row = normalizeMcp(name, config, source + '#projects:' + path, path); row.external = true; rows.set(row.id, row);
          }
        }
      } catch (error) { if (error.code !== 'ENOENT') issues.push({ source, message: error.code === 'EACCES' ? '没有读取权限。' : '无法解析配置；未执行或修改该文件。' }); }
    }
    // Include live native MCP tools even when their bundle config is outside the known files.
    for (const tool of this.schemas()) {
      if (!tool.name.startsWith('mcp__') || [...rows.values()].some(r => tool.name.startsWith('mcp__' + r.namespace + '__'))) continue;
      const name = tool.name.slice(5).split('__')[0];
      if (!name || name.startsWith('wc_')) continue;
      const id = 'native:' + name;
      rows.set(id, { id, name, namespace: name, source: 'DSH 当前工具注册表', workspace: '', native: true, fingerprint: hash(id) });
    }
    this.rows = rows; this.issues = issues; this.scannedAt = new Date().toISOString(); return rows;
  }
  matching(tool) { return [...this.rows.values()].filter(row => tool.startsWith('mcp__' + row.namespace + '__')); }
}
