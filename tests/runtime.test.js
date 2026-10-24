import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Context } from '@deepseek-ai/cordis';
import SkillRegistry from '@deepseek-ai/dsh-skill';
import ToolRuntime, { defineTool } from '@deepseek-ai/dsh-tools';
import SystemPrompt from '@deepseek-ai/dsh-system-prompt';
import McpResources from '@deepseek-ai/dsh-mcp-resources';
import { createScope } from '@deepseek-ai/dsh-scope';
import { createRuntime } from '../runtime.js';
import { emptyPolicy } from '../policy.js';
import { Discovery } from '../discovery.js';

export async function fixture(t) {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, {}).await(); await ctx.plugin(ToolRuntime, {}).await();
  await ctx.plugin(SkillRegistry).await(); await ctx.plugin(McpResources).await();
  const store = { state: emptyPolicy() }, agents = [];
  ctx.provide('agents'); ctx.set('agents', { list: () => agents });
  const discovery = new Discovery({ home: '/tmp/none', dshHome: '/tmp/none', schemas: () => ctx.tools.schemas(), workspaces: async () => [{ path: '/tmp/a' }, { path: '/tmp/b' }] });
  let runtime;
  const plugin = ctx.plugin({ name: 'test-policy', inject: ['skills', 'tools', 'agents'], async apply(child) { runtime = createRuntime(child, store, discovery); } }); await plugin.await();
  t.after(async () => { await ctx.fiber.dispose(); });
  const agent = (cwd = '/tmp/a', parent) => {
    const value = { session: { header: { cwd }, id: cwd } };
    const scoped = createScope(plugin.ctx, value, parent ? { parent } : undefined); value.ctx = scoped.ctx; agents.push(value); return value;
  };
  let id = 0;
  const execute = (name, args = {}, agent) => ctx.tools.execute({ name, arguments: args, agent, signal: new AbortController().signal, callId: 'test-' + ++id });
  return { ctx, store, discovery, runtime, plugin, agent, execute };
}
test('real SkillRegistry blocks list and body loading, honors workspace and parent scope, restores on teardown', async t => {
  const f = await fixture(t);
  f.ctx.skills.register({ name: 'example', description: 'Example skill', content: 'BODY', source: 'test' });
  assert.equal((await f.ctx.skills.list()).length, 0); assert.equal(await f.ctx.skills.get('example'), undefined);
  assert.equal((await f.runtime.originalSnapshot()).skills.length, 1);
  f.store.state.global.skills.example = true;
  assert.equal((await f.ctx.skills.get('example')).content, 'BODY');
  const a = f.agent(), child = f.agent('/tmp/b', a);
  f.store.state.workspaces['/tmp/a'] = { skills: { example: false }, mcp: {} };
  assert.equal(await a.ctx.skills.get('example'), undefined);
  assert.equal(await child.ctx.skills.get('example', { cwd: '/tmp/b' }), undefined);
  assert.equal((await f.ctx.skills.list({ scope: a, cwd: '/tmp/b' })).length, 0);
  await f.plugin.dispose(); assert.equal((await f.ctx.skills.get('example')).content, 'BODY');
});
test('real ToolRuntime guards block MCP and resources, allow ordinary tools, and update without restart', async t => {
  const f = await fixture(t); let calls = 0;
  const row = { id: 'native:test', name: 'test', namespace: 'test', native: true, source: 'native', workspace: '' }; f.discovery.rows.set(row.id, row);
  const register = name => f.ctx.tools.register(defineTool({ name, description: name, parameters: {}, output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] }, execute: async () => { calls++; return { ok: true }; } }));
  register('mcp__test__ping'); register('ordinary');
  const ordinary = await f.execute('ordinary'); assert.equal(ordinary.isError, false, JSON.stringify(ordinary));
  const before = calls; assert.equal((await f.execute('mcp__test__ping')).isError, true); assert.equal(calls, before);
  f.store.state.global.mcp[row.id] = true;
  assert.equal((await f.execute('mcp__test__ping')).isError, false);
  const a = f.agent(); f.store.state.workspaces['/tmp/a'] = { skills: {}, mcp: { [row.id]: false } }; await f.runtime.changed();
  assert.equal(f.ctx.tools.schemas(a).some(tool => tool.name === 'mcp__test__ping'), false);
  assert.equal((await f.execute('mcp__test__ping', {}, a)).isError, true);
  register('mcp__test__new'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.ctx.tools.schemas(a).some(tool => tool.name === 'mcp__test__new'), false);
  f.store.state.workspaces['/tmp/a'].mcp[row.id] = true; await f.runtime.changed();
  assert.equal((await f.execute('mcp__test__new', {}, a)).isError, false);
  f.ctx.mcpResources.register('test', { request: async () => { calls++; return { resources: [] }; } });
  f.store.state.workspaces['/tmp/a'].mcp[row.id] = false;
  const count = calls; assert.equal((await f.execute('list_mcp_resources', { server: 'test' }, a)).isError, true); assert.equal(calls, count);
  assert.equal((await f.execute('list_mcp_resources', { server: 'test' })).isError, false);
});
test('system prompt hides disabled MCP schemas, instructions and resource names, preserving persona', async t => {
  const f = await fixture(t), row = { id: 'native:test', namespace: 'test', native: true, workspace: '' }; f.discovery.rows.set(row.id, row);
  f.ctx.systemPrompt.section({ name: 'mcp:test', order: 1, text: 'secret instructions' });
  f.ctx.systemPrompt.section({ name: 'persona:keep', order: 2, text: 'keep my personality' });
  f.ctx.tools.register(defineTool({ name: 'mcp__test__ping', description: 'ping', parameters: {}, output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] }, execute: async () => true }));
  const prompt = await f.ctx.systemPrompt.assemble();
  assert.ok(!JSON.stringify(prompt).includes('secret instructions')); assert.ok(!prompt.tools.some(tool => tool.name.startsWith('mcp__')));
  assert.ok(JSON.stringify(prompt).includes('keep my personality'));
  f.store.state.global.mcp[row.id] = true;
  const enabled = await f.ctx.systemPrompt.assemble(); assert.ok(JSON.stringify(enabled).includes('secret instructions')); assert.ok(enabled.tools.some(tool => tool.name.startsWith('mcp__')));
});
test('unrecognized or ambiguous MCP namespaces are denied conservatively', async t => {
  const f = await fixture(t);
  f.discovery.rows.set('a', { id: 'a', namespace: 'foo', native: true, workspace: '' });
  f.discovery.rows.set('b', { id: 'b', namespace: 'foo__bar', native: true, workspace: '' });
  f.store.state.global.mcp.a = true;
  assert.equal(f.runtime.toolAllowed('mcp__unknown__run', ''), false);
  assert.equal(f.runtime.toolAllowed('mcp__foo__bar__run', ''), false);
  f.store.state.global.mcp.b = true; assert.equal(f.runtime.toolAllowed('mcp__foo__bar__run', ''), true);
});

test('approved stdio MCP connects using the native client, dispatches and disconnects when disabled', async t => {
  const {mkdtemp,readFile}=await import('node:fs/promises'); const {tmpdir}=await import('node:os'); const {join}=await import('node:path'); const {fileURLToPath}=await import('node:url');
  const {normalizeMcp}=await import('../discovery.js');
  const f=await fixture(t), dir=await mkdtemp(join(tmpdir(),'wc-stdio-')), log=join(dir,'calls');
  const row=normalizeMcp('fake',{command:process.execPath,args:[fileURLToPath(new URL('./fake-mcp.mjs',import.meta.url)),log]},join(dir,'config.json'));
  f.discovery.rows.set(row.id,row);f.store.state.global.mcp[row.id]=true;
  await f.runtime.sync(); assert.equal(f.runtime.connectionStatus(row),'disconnected');
  f.store.state.approvals[row.id]=row.fingerprint;await f.runtime.sync();
  for(let i=0;i<100&&!f.ctx.tools.schemas().some(t=>t.name==='mcp__'+row.namespace+'__ping');i++)await new Promise(r=>setTimeout(r,20));
  const name='mcp__'+row.namespace+'__ping';assert.ok(f.ctx.tools.schemas().some(t=>t.name===name),f.runtime.connectionStatus(row));
  assert.equal((await f.execute(name)).isError,false);assert.equal(await readFile(log,'utf8'),'called\n');
  const a=f.agent();f.store.state.workspaces['/tmp/a']={skills:{},mcp:{[row.id]:false}};
  assert.equal((await f.execute(name,{},a)).isError,true);assert.equal(await readFile(log,'utf8'),'called\n');
  assert.equal((await f.execute('read_mcp_resource',{server:row.namespace,uri:'test://one'},a)).isError,true);
  f.store.state.global.mcp[row.id]=false;await f.runtime.changed();
  assert.equal(f.runtime.connectionStatus(row),'disconnected');assert.ok(!f.ctx.tools.schemas().some(t=>t.name===name));
});

test('real filesystem provider discovers project Skills and policy governs their bodies', async t => {
 const {mkdtemp,mkdir,writeFile}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {CapabilitySkillProvider}=await import('../skill-provider.js');
 const f=await fixture(t),dir=await mkdtemp(join(tmpdir(),'wc-project-skills-'));await mkdir(join(dir,'.git'));
 for(const [root,name] of [['.agents','agent-skill'],['.claude','claude-skill'],['.codex','codex-skill']]){const folder=join(dir,root,'skills',name);await mkdir(folder,{recursive:true});await writeFile(join(folder,'SKILL.md'),'---\nname: '+name+'\ndescription: Test skill\n---\nTEST BODY\n');}
 let provider;f.ctx.skills.registerProvider(control=>provider=new CapabilitySkillProvider(f.ctx,control,{providerName:'test-filesystem',dshHome:join(dir,'user-dsh'),agentsHome:join(dir,'user-agents'),watch:false}));t.after(()=>provider.dispose());
 const raw=await f.runtime.originalSnapshot({cwd:dir});assert.deepEqual(raw.skills.map(s=>s.name),['agent-skill','claude-skill','codex-skill']);
 const a=f.agent(dir);assert.equal((await f.ctx.skills.list({scope:a,cwd:dir})).length,0);
 f.store.state.workspaces[dir]={skills:{'claude-skill':true},mcp:{}};
 const actual=await f.ctx.skills.list({scope:a,cwd:dir});assert.deepEqual(actual.map(s=>s.name),['claude-skill']);assert.equal((await f.ctx.skills.get('claude-skill',{scope:a,cwd:dir})).content,'TEST BODY');assert.equal(await f.ctx.skills.get('agent-skill',{scope:a,cwd:dir}),undefined);
});

test('nested tool dispatch passes through the same MCP execution guard', async t=>{
 const f=await fixture(t);let called=0;
 const output={schema:{type:'json'},render:(_args,value)=>[{type:'text',text:JSON.stringify(value)}]};
 f.ctx.tools.register(defineTool({name:'mcp__blocked__ping',description:'ping',parameters:{},output,execute:async()=>{called++;return true;}}));
 f.ctx.tools.register(defineTool({name:'nested_call',description:'nested',parameters:{},output,execute:async(_args,exec)=>{const result=await f.ctx.tools.execute({name:'mcp__blocked__ping',arguments:{},agent:exec.agent,parent:exec.token,signal:exec.signal,callId:'nested'});return {innerDenied:result.isError};}}));
 const result=await f.execute('nested_call');assert.equal(result.isError,false);assert.equal(called,0);assert.ok(JSON.stringify(result).includes('innerDenied'));
});

test('external source switch immediately hides and blocks external Skill bodies while native Skills remain', async t=>{
 const f=await fixture(t);
 for(const [name,provider] of [['native-skill','runtime'],['external-skill','workspace-capabilities-filesystem']]){f.ctx.skills.register({name,provider,description:'A skill',content:'BODY',source:'test'});f.store.state.global.skills[name]=true;}
 assert.deepEqual((await f.runtime.originalSnapshot()).skills.map(s=>s.name),['native-skill']);
 assert.equal(await f.ctx.skills.get('external-skill'),undefined);assert.ok(await f.ctx.skills.get('native-skill'));
 f.store.state.discovery.includeExternal=true;assert.equal((await f.ctx.skills.list()).length,2);assert.ok(await f.ctx.skills.get('external-skill'));
 f.store.state.discovery.includeExternal=false;assert.equal(await f.ctx.skills.get('external-skill'),undefined);assert.equal((await f.ctx.skills.list()).length,1);
});

test('switching external discovery off immediately blocks previously approved MCP before the scan finishes',async t=>{
 const f=await fixture(t),row={id:'external',namespace:'external',external:true,workspace:'',fingerprint:'hash'};
 f.discovery.rows.set(row.id,row);f.store.state.global.mcp[row.id]=true;f.store.state.approvals[row.id]='hash';
 f.store.state.discovery.includeExternal=true;assert.equal(f.runtime.toolAllowed('mcp__external__ping',''),true);
 f.store.state.discovery.includeExternal=false;assert.equal(f.runtime.toolAllowed('mcp__external__ping',''),false);assert.equal(f.runtime.toolAllowed('read_mcp_resource','',{server:'external'}),false);
});
