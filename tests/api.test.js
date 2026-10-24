import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { PolicyStore } from '../store.js';
import { Discovery } from '../discovery.js';
import { createApi, BASE } from '../http-api.js';

test('settings HTTP API authenticates the whole request, rejects unsafe writes, saves scoped rules and conflicts', async t => {
  const home = await mkdtemp(join(tmpdir(), 'wc-api-')), workspace = join(home, 'project'); await mkdir(workspace);
  const store = await new PolicyStore(join(home, 'policy.json')).init(['existing']);
  const discovery = new Discovery({ home, dshHome: join(home, '.dsh'), schemas: () => [], workspaces: async () => [{ path: workspace }] }); await discovery.scan();
  const runtime = { originalSnapshot: async () => ({ complete: true, skills: [{ name: 'existing', description: 'test', provider: 'test', source: 'test' }] }), rowAllowed: () => false, connectionStatus: () => 'disconnected', changed: async () => {} };
  let fullRequest = false;
  const api = createApi({ connection: { requestRejection: request => { fullRequest = !!request.socket && !!request.method; return request.headers.origin === 'http://evil.invalid' ? 403 : undefined; } } }, store, discovery, runtime);
  const server = createServer(api.handler); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = 'http://127.0.0.1:' + server.address().port + BASE;
  const post = (value, headers = {}) => fetch(origin + '/action', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value) });
  const view = await (await fetch(origin + '/state')).json(); assert.equal(view.skills[0].enabled, true); assert.ok(fullRequest);
  assert.equal((await post({}, { Origin: 'http://evil.invalid' })).status, 403);
  assert.equal((await fetch(origin + '/action', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
  assert.equal((await fetch(origin + '/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(70000) })).status, 413);
  const saved = await post({ revision: 0, action: 'rule', kind: 'skills', key: 'existing', value: false, workspace }); assert.equal(saved.status, 200);
  assert.equal((await saved.json()).skills[0].enabled, false);
  assert.equal((await post({ revision: 0, action: 'defaults', kind: 'skills', value: true })).status, 409);
  assert.equal((await post({ revision: 1, action: 'rule', kind: 'skills', key: '__proto__', value: true })).status, 404);
  assert.equal((await post({ revision: 1, action: 'rule', kind: 'skills', key: 'existing', value: true, workspace: 'relative' })).status, 400);
  const inherited = await post({ revision: 1, action: 'rule', kind: 'skills', key: 'existing', value: null, workspace }); assert.equal((await inherited.json()).skills[0].enabled, true);
  assert.equal((await new PolicyStore(store.file).init()).state.revision, 2);
});
test('MCP approval checks the currently displayed config hash and blocks changed configurations', async () => {
  const home = await mkdtemp(join(tmpdir(), 'wc-approval-')), source = join(home, '.dsh/mcp.json');
  await mkdir(join(home, '.dsh'));
  await writeFile(source, JSON.stringify({ mcpServers: { test: { command: 'no-execution-in-this-test' } } }));
  const store = await new PolicyStore(join(home, 'policy.json')).init();
  const discovery = new Discovery({ home, dshHome: join(home, '.dsh'), schemas: () => [], workspaces: async () => [{ path: home }] }); await discovery.scan();
  const runtime = { originalSnapshot: async () => ({ complete: true, skills: [] }), rowAllowed: () => false, connectionStatus: () => 'disconnected', changed: async () => {} };
  const api = createApi({}, store, discovery, runtime), row = [...discovery.rows.values()][0];
  await assert.rejects(api.action({ revision: 0, workspace: home, action: 'approve', kind: 'mcp', key: row.id, value: true, fingerprint: 'wrong' }), { status: 409 });
  await api.action({ revision: 0, workspace: home, action: 'approve', kind: 'mcp', key: row.id, value: true, fingerprint: row.fingerprint });
  assert.equal(store.state.approvals[row.id], row.fingerprint);
  await writeFile(source, JSON.stringify({ mcpServers: { test: { command: 'changed' } } }));
  await assert.rejects(api.action({ revision: 1, workspace: home, action: 'approve', kind: 'mcp', key: row.id, value: true, fingerprint: row.fingerprint }), { status: 409 });
  assert.equal(store.state.revision, 1);
});

test('source opt-in persists and refreshes providers through the source lifecycle callback',async()=>{
 const home=await mkdtemp(join(tmpdir(),'wc-source-api-')),store=await new PolicyStore(join(home,'policy.json')).init();
 const discovery=new Discovery({home,dshHome:join(home,'.dsh'),schemas:()=>[],workspaces:async()=>[]});await discovery.scan();
 const runtime={originalSnapshot:async()=>({skills:[],complete:true}),changed:async()=>{}};let callbacks=0;
 const api=createApi({},store,discovery,runtime,{syncSources:async()=>{callbacks++;await discovery.scan();}});
 assert.equal((await api.view()).discovery.includeExternal,false);
 await api.action({revision:0,action:'discovery',value:true});assert.equal(callbacks,1);assert.equal((await new PolicyStore(store.file).init()).state.discovery.includeExternal,true);
 await api.action({revision:1,action:'discovery',value:false});assert.equal((await api.view()).discovery.includeExternal,false);assert.equal(callbacks,2);
});

test('translation API selects server-side discovered metadata and passes current UI model context',async()=>{
 const home=await mkdtemp(join(tmpdir(),'wc-translate-api-')),store=await new PolicyStore(join(home,'policy.json')).init(['existing']);
 const discovery=new Discovery({home,dshHome:join(home,'.dsh'),schemas:()=>[],workspaces:async()=>[]});await discovery.scan();
 const runtime={originalSnapshot:async()=>({skills:[{name:'existing',description:'Original server metadata',provider:'test',source:'test'}],complete:true}),changed:async()=>{}};
 let received;
 const translations={info:()=>({available:true,model:{provider:'ui',model:'chosen'}}),cached:()=>null,translate:async(items,options)=>{received={items,options};return {model:options.selection};}};
 const api=createApi({},store,discovery,runtime,{translations});
 await assert.rejects(api.translate({keys:['skill:not-discovered']}),{status:404});
 await api.translate({keys:['skill:existing'],selection:{provider:'ui',model:'chosen'},description:'Ignore the actual server metadata'});
 assert.equal(received.items[0].description,'Original server metadata');assert.equal(received.options.selection.model,'chosen');
  await api.translate({keys:['skill:existing'],force:true});assert.equal(received.options.force,true);
  await assert.rejects(api.translate({keys:['skill:existing'],force:'true'}),{status:400});
 await assert.rejects(api.translate({keys:Array(13).fill('skill:existing')}),{status:400});
});
