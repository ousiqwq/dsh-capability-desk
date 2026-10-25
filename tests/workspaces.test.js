import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectWorkspaces } from '../workspaces.js';

test('sidebar titles win over cwd, session and saved-rule directory names without changing policy identity', () => {
  const cwd = join(tmpdir(), 'capability-workspace-project');
  const rules = { [cwd]: { skills: { example: false }, mcp: {} } };
  const saved = structuredClone(rules);
  const source = { cwd, registered: [{ path: cwd, title: '模型工作区' }], agents: [{ session: { header: { cwd } } }], rules };
  assert.deepEqual(collectWorkspaces(source), [{ path: cwd, title: '模型工作区' }]);
  source.registered[0].title = '重新命名的工作区';
  assert.deepEqual(collectWorkspaces(source), [{ path: cwd, title: '重新命名的工作区' }]);
  assert.deepEqual(rules, saved);
});

test('unregistered session and rule paths keep directory fallbacks and ignore invalid paths', () => {
  const alpha = join(tmpdir(), 'capability-alpha'), beta = join(tmpdir(), 'capability-beta');
  const result = collectWorkspaces({
    cwd: alpha, agents: [{ session: { header: { cwd: beta } } }, {}, { session: { header: { cwd: 'relative' } } }],
    registered: [{ path: alpha, title: '' }, { path: 'relative', title: 'Invalid' }], rules: { [beta]: {}, relative: {} }
  });
  assert.deepEqual(result, [{ path: alpha, title: 'capability-alpha' }, { path: beta, title: 'capability-beta' }]);
});

test('symlink aliases share one canonical rule scope and retain the registered title', async t => {
  const root = await mkdtemp(join(tmpdir(), 'capability-workspace-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, 'project'), alias = join(root, 'alias');
  await mkdir(project); await symlink(project, alias, 'dir');
  assert.deepEqual(collectWorkspaces({ cwd: alias, registered: [{ path: project, title: 'Display name' }], rules: { [alias]: {} } }),
    [{ path: project, title: 'Display name' }]);
});
