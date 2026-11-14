import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// This integration check runs against a DSH instance on the same host.
const root = (process.env.DSH_TEST_URL || 'http://127.0.0.1:3080').replace(/\/$/, '');
const api = root + '/workspace-capabilities/v1';
const directory = await mkdtemp(join(tmpdir(), 'capability-desk-workspace-'));
const browser = await chromium.launch({ headless: true, ...(process.env.DSH_TEST_CHROME?{executablePath:process.env.DSH_TEST_CHROME}:{}), args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-CN' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let workspaceId;
async function rpc(method, args) {
  const response = await page.request.post(root + '/api/' + method, {
    headers: { Origin: root },
    data: { type: 'client-request', rpcId: randomUUID(), method, payload: { args } }
  });
  assert.equal(response.status(), 200);
  const { result } = await response.json();
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.value;
}
async function state(query = '') {
  const response = await page.request.get(api + '/state' + query);
  assert.equal(response.status(), 200);
  return response.json();
}
async function titleIs(title) {
  if (await scope.getAttribute('aria-expanded') === 'false') await scope.click();
  await page.waitForFunction(({ path, title }) => {
    const paths = [...document.querySelectorAll('.wc-scope-path')].filter(el => el.textContent === path);
    return paths.length === 1 && paths[0].previousElementSibling.textContent === title;
  }, { path: directory, title }, { timeout: 5000 });
  await page.keyboard.press('Escape');
}
const scope = page.getByRole('button', { name: '规则范围', exact: true });
try {
  const initial = await state();
  // Mount the existing UI first: a fresh client otherwise opens the newest workspace
  // and DSH can create an empty draft in the temporary test directory.
  await page.goto(root);
  await page.getByRole('button', { name: /^(账号菜单|Account menu)$/ }).click();
  await page.getByText(/^(设置|Settings)$/).click();
  await page.getByRole('button', { name: 'Skill 与 MCP', exact: true }).click();
  await scope.waitFor();
  const created = await rpc('workspace/create', { request: { path: directory } });
  assert.equal(created.created, true, 'Use a fresh temporary directory, never rename an existing workspace');
  workspaceId = created.workspace.workspaceId;
  const first = 'Workspace rename test';
  await rpc('workspace/rename', { request: { workspaceId, title: first } });
  await titleIs(first);
  await scope.click();await page.getByRole('menuitem').filter({hasText:directory}).click();
  const stale = await state('?workspace=' + encodeURIComponent(directory));
  assert.equal(stale.workspaces.find(item => item.path === directory)?.title, first);
  // Keep every HTTP refresh stale: only the sidebar's native subscription can pass.
  await page.route(api + '/state?*', route => route.fulfill({ json: stale }));
  for (const title of ['实时重命名测试', 'Renamed again · 建模']) {
    await rpc('workspace/rename', { request: { workspaceId, title } });
    await titleIs(title);
    assert.equal(await scope.innerText(), title, 'Renaming must update the selected title');
    assert.ok(new URL((await page.waitForResponse(response=>response.url().startsWith(api+'/state?'),{timeout:6500})).url()).searchParams.get('workspace')===directory,'Renaming must retain the selected policy path');
    assert.equal((await state()).workspaces.find(item => item.path === directory)?.title, title);
  }
  await page.waitForResponse(response => response.url().startsWith(api + '/state?'), { timeout: 6500 });
  await titleIs('Renamed again · 建模');
  assert.deepEqual(errors, []);
  const final = await state();
  assert.equal(final.revision, initial.revision);
  assert.deepEqual(final.defaults, initial.defaults);
  assert.deepEqual(final.discovery, initial.discovery);
  const sessions = await rpc('session/list', { _request: {} });
  assert.equal(sessions.items.some(item => item.cwd === directory), false, 'The test must not leave a draft Session');
  console.log('Workspace checks passed: registry titles, live renames with stale HTTP, stable selected scope, no duplicates, unchanged policy, zero page errors.');
} finally {
  try { if (workspaceId) await rpc('workspace/delete', { request: { workspaceId } }); }
  finally { await browser.close(); await rm(directory, { recursive: true, force: true }); }
}
