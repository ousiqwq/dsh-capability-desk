import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Discovery, normalizeMcp, publicMcp } from '../discovery.js';

test('stdio configs have stable identity and credential-sensitive approval hashes without exposing secrets', () => {
  const row = normalizeMcp('test', { command: 'node', args: ['secret-key'], env: { TOKEN: 'SECRET_A' } }, '/tmp/source');
  const changed = normalizeMcp('test', { command: 'node', args: ['secret-key'], env: { TOKEN: 'SECRET_B' } }, '/tmp/source');
  assert.equal(row.id, changed.id); assert.notEqual(row.fingerprint, changed.fingerprint);
  assert.ok(!JSON.stringify(publicMcp(row)).includes('SECRET_A')); assert.ok(!JSON.stringify(publicMcp(row)).includes('secret-key'));
  assert.deepEqual(publicMcp(row).envNames, ['TOKEN']); assert.ok(row.namespace.length <= 32);
});
test('HTTP UI omits credentials, query tokens and headers', () => {
  const row = normalizeMcp('http', { url: 'https://user:pass@example.com/mcp?token=private', headers: { Authorization: 'Bearer hidden' } }, '/tmp/source');
  const view = JSON.stringify(publicMcp(row));
  for (const secret of ['user:', 'pass', 'private', 'hidden']) assert.ok(!view.includes(secret));
  assert.equal(publicMcp(row).launch, 'https://example.com/mcp');
});
test('unsupported or malformed configurations stay discoverable but cannot connect', () => {
  for (const raw of [{ url: 'file:///etc/passwd' }, { command: 'node', args: {} }, { url: 'https://a', type: 'sse' }, {}, { command: 'x', disabled: true }, { command: 'x', env: { x: 3 } }]) assert.ok(normalizeMcp('bad', raw, '/tmp/s').problem);
});
test('scanner discovers TOML, JSON, native YAML and workspace definitions without running commands', async () => {
  const home = await mkdtemp(join(tmpdir(), 'wc-discovery-')), dshHome = join(home, '.dsh'), workspace = join(home, 'project');
  for (const path of [join(home, '.codex'), join(dshHome, 'profiles/web'), workspace]) await mkdir(path, { recursive: true });
  await writeFile(join(home, '.codex/config.toml'), '[mcp_servers.test]\ncommand="never-execute-this"\nargs=["abc"]\n');
  await writeFile(join(workspace, '.mcp.json'), JSON.stringify({ mcpServers: { test: { command: 'another-never-run' } } }));
  await writeFile(join(dshHome, 'profiles/web/cordis.patch.yml'), '- name: "@deepseek-ai/dsh-mcp-client"\n  config:\n    serverName: native\n    command: no-run\n    env:\n      TOKEN: !js process.env.TEST_WC_TOKEN\n');
  const discovery = new Discovery({ home, dshHome, schemas: () => [], workspaces: async () => [{ path: workspace }], includeExternal: () => true });
  await discovery.scan(); assert.equal(discovery.rows.size, 3);
  assert.equal([...discovery.rows.values()].filter(row => row.name === 'test').length, 2);
  assert.equal([...discovery.rows.values()].find(row => row.workspace).workspace, workspace);
  assert.equal([...discovery.rows.values()].find(row => row.native).namespace, 'native');
  await writeFile(join(workspace, '.mcp.json'), '{malformed'); await discovery.scan();
  assert.equal(discovery.rows.size, 2); assert.equal(discovery.issues.length, 1);
});
test('default discovery reads only DSH sources; external sources can be enabled and removed again', async () => {
  const home = await mkdtemp(join(tmpdir(), 'wc-native-discovery-')), dshHome = join(home, '.dsh'), workspace = join(home, 'project');
  for (const directory of [dshHome, join(home, '.codex'), join(workspace, '.dsh')]) await mkdir(directory, { recursive: true });
  const config = name => JSON.stringify({ mcpServers: { [name]: { command: 'never-run' } } });
  await writeFile(join(dshHome, 'mcp.json'), config('dsh-only'));
  await writeFile(join(workspace, '.dsh/mcp.json'), config('dsh-project'));
  await writeFile(join(home, '.codex/config.toml'), '[mcp_servers.external]\ncommand="never-run"\n');
  await writeFile(join(workspace, '.mcp.json'), config('shared-project'));
  let enabled = false;
  const discovery = new Discovery({ home, dshHome, schemas: () => [], workspaces: async () => [{ path: workspace }], includeExternal: () => enabled });
  await discovery.scan(); assert.deepEqual([...discovery.rows.values()].map(row => row.name).sort(), ['dsh-only', 'dsh-project']);
  assert.ok(!(await discovery.sources()).some(([source]) => source.includes('.codex') || source.endsWith('/project/.mcp.json')));
  enabled = true; await discovery.scan(); assert.equal(discovery.rows.size, 4);
  enabled = false; await discovery.scan(); assert.equal(discovery.rows.size, 2);
});
