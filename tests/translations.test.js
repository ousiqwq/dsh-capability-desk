import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TranslationService, translationTargets } from '../translations.js';

const item = { key: 'skill:example', kind: 'skills', name: 'example', description: 'Create a skill.' };
async function fixture(t, generator) {
  const calls = [], file = join(await mkdtemp(join(tmpdir(), 'wc-translations-')), 'cache.json');
  const services = {
    llm: { listProviders: () => [{ id: 'default' }, { id: 'selected' }], async *stream(options) {
      calls.push(options);
      if (generator) { yield* generator(options); return; }
      const input = JSON.parse(options.messages[0].content[0].text);
      yield { type: 'text-delta', text: JSON.stringify({ items: input.items.map(entry => ({ key: entry.key, title: '示例技能', description: entry.description ? '创建技能。' : '' })) }) };
      yield { type: 'finish', reason: 'stop' };
    } },
    agentDefaultModel: { currentSelection: () => ({ provider: 'default', model: 'default-model' }) },
    agents: { get: () => ({ session: { requestHeader: () => ({ config: { provider: 'selected', model: 'session-model' } }) } }) }
  };
  const service = await new TranslationService({ get: name => services[name] }, file).init(); t.after(() => service.close());
  return { service, calls, services, file };
}
test('translation uses the UI selection instead of session or server defaults and sends metadata only', async t => {
  const f = await fixture(t);
  await f.service.translate([item], { sessionId: 'session', selection: { provider: 'selected', model: 'ui-model', reasoningEffort: 'low' } });
  assert.equal(f.calls.length, 1); assert.equal(f.calls[0].model, 'ui-model'); assert.equal(f.calls[0].provider, 'selected');
  assert.equal(f.calls[0].reasoningEffort, 'low'); assert.equal(f.calls[0].tools, undefined);
  assert.deepEqual(JSON.parse(f.calls[0].messages[0].content[0].text), { items: [item] });
  assert.equal(f.service.cached(item, { provider: 'selected', model: 'ui-model' }).description, '创建技能。');
});
test('session selection takes precedence over default model; no-session view uses DSH default', async t => {
  const f = await fixture(t);
  assert.equal(f.service.model({ sessionId: 'session' }).model, 'session-model');
  assert.equal(f.service.model().model, 'default-model');
  f.services.llm = undefined; assert.equal(f.service.info().available, false);
  assert.throws(() => f.service.model(), { status: 503 });
});
test('translation cache survives restart and invalidates when the text or current model changes', async t => {
  const f = await fixture(t);
  await f.service.translate([item]);
  const repeated = await f.service.translate([item]); assert.equal(repeated.cached, true); assert.equal(f.calls.length, 1);
  const restored = await new TranslationService({ get: name => f.services[name] }, f.file).init(); t.after(() => restored.close());
  assert.equal((await restored.translate([item])).cached, true); assert.equal(f.calls.length, 1);
  assert.equal(restored.cached({ ...item, description: 'Changed description' }, restored.model()), null);
  assert.equal(restored.cached(item, { provider: 'selected', model: 'another-model' }), null);
});
test('explicit retranslation bypasses the old cache and persists the replacement without changing normal cache hits', async t => {
  let generation = 0;
  const f = await fixture(t, async function* () { generation++; yield { type: 'text-delta', text: JSON.stringify({ items: [{ key: item.key, title: '示例', description: '第' + generation + '版译文' }] }) }; });
  await f.service.translate([item]);
  assert.equal((await f.service.translate([item])).cached, true); assert.equal(generation, 1);
  const refreshed = await f.service.translate([item], { force: true });
  assert.equal(refreshed.cached, false); assert.equal(generation, 2);
  assert.equal(f.service.cached(item, f.service.model()).description, '第2版译文');
  const restored = await new TranslationService({ get: name => f.services[name] }, f.file).init(); t.after(() => restored.close());
  assert.equal((await restored.translate([item])).cached, true); assert.equal(generation, 2);
  assert.equal(restored.cached(item, restored.model()).description, '第2版译文');
});
test('failed retranslation preserves the previously cached text and its on-disk copy', async t => {
  let fail = false;
  const f = await fixture(t, async function* () { yield { type: 'text-delta', text: fail ? 'invalid JSON' : JSON.stringify({ items: [{ key: item.key, title: '示例', description: '有效的旧译文' }] }) }; });
  await f.service.translate([item]); fail = true;
  await assert.rejects(f.service.translate([item], { force: true }), { status: 502 });
  assert.equal(f.service.cached(item, f.service.model()).description, '有效的旧译文');
  const restored = await new TranslationService({ get: name => f.services[name] }, f.file).init(); t.after(() => restored.close());
  assert.equal(restored.cached(item, restored.model()).description, '有效的旧译文');
});
test('malformed retranslation flags are rejected before calling the model', async t => {
  const f = await fixture(t);
  assert.throws(() => f.service.translate([item], { force: 'true' }), { status: 400 }); assert.equal(f.calls.length, 0);
});
test('bad or incomplete translation output never populates the cache', async t => {
  const f = await fixture(t, async function* () { yield { type: 'text-delta', text: '{"items":[]}' }; });
  await assert.rejects(f.service.translate([item]), { status: 502 }); assert.equal(f.service.cache.size, 0);
});
test('model failure chunks and aborted requests are reported without saving fabricated translations', async t => {
  const f = await fixture(t, async function* () { yield { type: 'finish', reason: 'error' }; });
  await assert.rejects(f.service.translate([item]), { status: 502 }); assert.equal(f.service.cache.size, 0);
  const cancel = new AbortController(); cancel.abort();
  await assert.rejects(f.service.translate([item], { signal: cancel.signal }), { status: 502 }); assert.equal(f.service.cache.size, 0);
});
test('concurrent identical requests share a single model call and unrelated batches are bounded', async t => {
  let resume; const gate = new Promise(resolve => { resume = resolve; });
  const f = await fixture(t, async function* () { await gate; yield { type: 'text-delta', text: JSON.stringify({ items: [{ key: item.key, title: '示例', description: '创建技能。' }] }) }; });
  const first = f.service.translate([item]), second = f.service.translate([item]); assert.equal(first, second);
  assert.throws(() => f.service.translate([{ ...item, key: 'skill:another' }]), { status: 429 });
  resume(); await first; assert.equal(f.calls.length, 1);
});
test('MCP translation targets cover the server and native tool descriptions, excluding configuration secrets', () => {
  const targets = translationTargets({ skills: [], mcp: [{ id: 'x', name: 'server', description: '', env: { KEY: 'secret' }, toolDetails: [{ name: 'mcp__x__run', description: 'Run analysis' }] }] });
  assert.deepEqual(targets.map(entry => entry.key), ['mcp:x', 'tool:mcp__x__run']);
  assert.ok(!JSON.stringify(targets).includes('secret'));
});
