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

test('custom target languages have separate caches and aliases share the same target', async t => {
  const f = await fixture(t);
  await f.service.translate([item], { targetLanguage: 'English' });
  await f.service.translate([item], { targetLanguage: '英文' });
  assert.equal(f.calls.length, 1);
  assert.match(f.calls[0].system, /"targetLanguage":"English"/);
  await f.service.translate([item], { targetLanguage: '繁體中文' });
  assert.equal(f.calls.length, 2);
  assert.match(f.calls[1].system, /"targetLanguage":"繁體中文"/);
  assert.equal(f.service.cached(item, f.service.model(), { targetLanguage: '日本語' }), null);
  assert.throws(() => f.service.translate([item], { targetLanguage: 42 }), { status: 400 });
  assert.throws(() => f.service.translate([item], { targetLanguage: 'a'.repeat(161) }), { status: 400 });
});
test('same-language decisions preserve exact source, are cached, and can be forced', async t => {
  const f = await fixture(t, async function* (options) {
    const input = JSON.parse(options.messages[0].content[0].text), force = options.system.includes('"force":true');
    yield { type: 'text-delta', text: JSON.stringify({ items: input.items.map(entry => ({ key: entry.key, status: force ? 'translated' : 'same_language', title: force ? 'Fresh title' : 'must not rewrite', description: force ? 'Fresh description' : 'must not rewrite' })) }) };
  });
  const source = { ...item, description: '  中文说明，保留 Ghidra 与 /tmp/example。\n' };
  const skipped = await f.service.translate([source]);assert.equal(skipped.skipped, 1);
  assert.equal(f.service.cached(source, f.service.model()).description, source.description);
  await f.service.translate([source]);assert.equal(f.calls.length, 1);
  await f.service.translate([source], { force: true });assert.equal(f.calls.length, 2);
  assert.equal(f.service.cached(source, f.service.model()).status, 'translated');
  assert.equal(f.service.cached(source, f.service.model()).description, 'Fresh description');
  assert.match(f.calls[0].system, /Detect source languages automatically/);
  assert.match(f.calls[0].system, /mixed-language prose still needs translation/);
});
test('follow-interface target snapshots change without translating on read', async t => {
  const f = await fixture(t);
  assert.equal(f.service.info({ uiLocale: 'en' }).target.label, 'English');
  assert.equal(f.service.info({ uiLocale: 'zh' }).target.label, '简体中文');
  assert.equal(f.service.info({ uiLocale: 'ja' }).target.label, '日本語');
  assert.equal(f.calls.length, 0);
  await f.service.translate([item], { uiLocale: 'en' });
  assert.ok(f.service.cached(item, f.service.model(), { uiLocale: 'en' }));
  assert.equal(f.service.cached(item, f.service.model(), { uiLocale: 'zh' }), null);
});
test('legacy Chinese cache is retained only for the matching target after restart', async t => {
  const { writeFile } = await import('node:fs/promises'), { createHash } = await import('node:crypto');
  const f = await fixture(t), model = f.service.model(), key = createHash('sha256').update(JSON.stringify([1, 'zh-CN', model.provider, model.model, item.key, item.name, item.description])).digest('hex');
  await writeFile(f.file, JSON.stringify({ version: 1, entries: [[key, { title: '旧标题', description: '旧缓存' }]] }));
  const service = await new TranslationService({ get: name => f.services[name] }, f.file).init();t.after(() => service.close());
  assert.equal(service.cached(item, model).description, '旧缓存');
  assert.equal(service.cached(item, model, { targetLanguage: 'English' }), null);
  await service.translate([item]);assert.equal(f.calls.length, 0);
  await service.translate([item], { targetLanguage: 'English' });
  const restored = await new TranslationService({ get: name => f.services[name] }, f.file).init();t.after(() => restored.close());
  assert.equal(restored.cached(item, model).description, '旧缓存');
  assert.ok(restored.cached(item, model, { targetLanguage: 'English' }));
});
test('force requests cannot join non-force classification and protocol failures preserve the last cache', async t => {
  let resume, skip = false;
  const gate = new Promise(resolve => { resume = resolve; });
  const f = await fixture(t, async function* () { await gate; yield { type: 'text-delta', text: JSON.stringify({ items: [{ key: item.key, status: skip ? 'same_language' : 'translated', title: 'Known', description: 'Known result' }] }) }; });
  const first = f.service.translate([item]);
  assert.throws(() => f.service.translate([item], { force: true }), { status: 429 });
  resume();await first;skip = true;
  await assert.rejects(f.service.translate([item], { force: true }), { status: 502 });
  assert.equal(f.service.cached(item, f.service.model()).description, 'Known result');
});

test('in-flight translation captures its configured target and empty descriptions stay empty', async t => {
  let resume;const gate=new Promise(r=>{resume=r;});const f=await fixture(t,async function* (){await gate;yield{type:'text-delta',text:JSON.stringify({items:[{key:item.key,status:'same_language'}]})};});
  let configured='English';const service=await new TranslationService({get:name=>f.services[name]},f.file,{targetLanguage:()=>configured}).init();t.after(()=>service.close());
  const work=service.translate([item]);configured='简体中文';resume();const result=await work;
  assert.equal(result.target.label,'English');assert.equal(result.skipped,1);assert.equal(service.cached(item,service.model()),null);assert.equal(service.cached(item,service.model(),{targetLanguage:'English'}).status,'same_language');
  const g=await fixture(t,async function* (options){const input=JSON.parse(options.messages[0].content[0].text);yield{type:'text-delta',text:JSON.stringify({items:input.items.map(e=>({key:e.key,title:e.name,description:'Invented description'}))})};});
  const empty={...item,description:''};await g.service.translate([empty]);assert.equal(g.service.cached(empty,g.service.model()).description,'');
});
