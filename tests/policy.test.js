import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { allowed, canonical, emptyPolicy, validateState, workspaceOf } from '../policy.js';
import { PolicyStore } from '../store.js';
import { bindScopeParent } from '@deepseek-ai/dsh-scope';

test('global defaults, workspace overrides, source isolation, and fail-closed state', () => {
  const state = emptyPolicy();
  assert.equal(allowed(state, 'skills', 's'), false);
  state.global.skills.s = true;
  assert.equal(allowed(state, 'skills', 's', '/tmp/a'), true);
  state.workspaces['/tmp/a'] = { skills: { s: false }, mcp: { x: true } };
  assert.equal(allowed(state, 'skills', 's', '/tmp/a'), false);
  state.workspaces['/tmp/a'].skills.s = true; state.global.skills.s = false;
  assert.equal(allowed(state, 'skills', 's', '/tmp/a'), true);
  assert.equal(allowed(state, 'mcp', 'x', '/tmp/a', '/tmp/b'), false);
  assert.equal(allowed(state, 'mcp', 'x', '/tmp/a', '/tmp/a'), true);
  assert.equal(allowed({ ...state, blocked: true }, 'mcp', 'x', '/tmp/a'), false);
});
test('existing policies migrate to native-only discovery and opt-in survives restart', async () => {
  const state = emptyPolicy(); delete state.discovery;
  assert.equal(validateState(state).discovery.includeExternal, false);
  const file = join(await mkdtemp(join(tmpdir(), 'wc-source-policy-')), 'policy.json');
  const store = await new PolicyStore(file).init();
  await store.update(0, next => { next.discovery.includeExternal = true; });
  assert.equal((await new PolicyStore(file).init()).state.discovery.includeExternal, true);
});
test('root workspace wins over child cwd and caller-supplied cwd', () => {
  const root = { session: { header: { cwd: '/tmp/root' } } };
  const child = { session: { header: { cwd: '/tmp/other' } } }; bindScopeParent(child, root);
  assert.equal(workspaceOf(child, '/tmp/bypass'), '/tmp/root');
  assert.equal(workspaceOf(undefined, '/tmp/a/../b'), '/tmp/b');
  assert.equal(canonical('relative'), '');
});
test('canonical paths resolve symlink workspace aliases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wc-link-'));
  await symlink(directory, directory + '-alias'); assert.equal(canonical(directory + '-alias'), directory);
});
test('persistent writes use revisions and survive restart, backup and restrictive permissions', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'wc-store-')), 'policy.json');
  const store = await new PolicyStore(file).init(['old-skill']);
  assert.equal(store.state.global.skills['old-skill'], true);
  assert.equal(allowed(store.state, 'skills', 'new-skill'), false);
  const writes = await Promise.allSettled([store.update(0, next => { next.global.skills.a = true; }), store.update(0, next => { next.global.skills.b = true; })]);
  assert.equal(writes.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(writes.find(item => item.status === 'rejected').reason.status, 409);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  assert.equal(JSON.parse(await readFile(file + '.bak', 'utf8')).revision, 0);
  const restored = await new PolicyStore(file).init(['should-not-be-added']);
  assert.deepEqual(restored.state, store.state);
  assert.equal(restored.state.global.skills['should-not-be-added'], undefined);
});
test('corrupt policy is preserved and fails closed rather than silently resetting', async () => {
  const file = join(await mkdtemp(join(tmpdir(), 'wc-corrupt-')), 'policy.json');
  await writeFile(file, '{broken'); const store = await new PolicyStore(file).init(['skill']);
  assert.equal(store.state.blocked, true); assert.ok(store.error);
  await assert.rejects(store.update(0, () => {}), { status: 503 }); assert.equal(await readFile(file, 'utf8'), '{broken');
});
for (const bad of [null, [], {}, { ...emptyPolicy(), revision: -1 }, { ...emptyPolicy(), global: { skills: JSON.parse('{"__proto__":true}'), mcp: {} } }, { ...emptyPolicy(), defaults: { skills: 'yes', mcp: false } }]) {
  test('invalid policy schema rejected: ' + JSON.stringify(bad), () => assert.throws(() => validateState(bad)));
}
