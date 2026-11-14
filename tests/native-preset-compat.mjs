// Native four-preset integration; only the isolated synthetic host is used.
import assert from 'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import{randomUUID,createHash}from'node:crypto';import{resolve,join}from'node:path';
const base='http://127.0.0.1:14086',host=resolve('../dsh-soul-desk/test-results/native-host'),out=resolve('test-results/preset-release-20261114');await mkdir(out,{recursive:true});
async function post(path,data){const r=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
async function rpc(method,args){const d=await post('/api/'+method,{type:'client-request',rpcId:randomUUID(),method,payload:{args}});assert.equal(d.result?.ok,true,JSON.stringify(d));return d.result.value;}
const state=async()=>{const r=await fetch(base+'/private-soul/v2/state');assert.equal(r.status,200);return r.json();};async function act(action,data){return post('/private-soul/v2/action',{action,data,expectedRevision:(await state()).revision});}
async function until(check,label){for(let n=0;n<250;n++){const v=await check();if(v)return v;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+label);}
async function logs(){return(await readFile(join(host,'reports/model-requests.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(s=>JSON.parse(s));}
async function prompt(sid,text){await rpc('session/prompt',{request:{sessionId:sid,requestId:randomUUID(),mode:'queue',content:[{type:'text',text}]}});const row=await until(async()=>(await logs()).find(r=>r.text===text),'model input');await until(async()=>!(await rpc('session/list',{_request:{}})).items.find(r=>r.sessionId===sid)?.running,'idle');return row;}
const report={runtime:'0.2.2-rc.2',modes:[]},sessions=[];let previous,cwd,originalSkill,originalMcp;
try{
 previous=await state();await act('settings',{enabled:true,mode:'priority'});const persona=(await act('persona-save',{name:'Four preset fixture',soul:'SOUL_PERSONA_A',activate:false})).personaId;await act('memory-save',{personaId:persona,kind:'preference',content:'用户喜欢 SOUL_PRIVATE_MEMORY 本地合成测试。'});
 const fixture=JSON.parse(await readFile(join(host,'fixture.json'),'utf8'));cwd=fixture.space.path;const bytes=Buffer.from([0,255,17,33,128,0,42]),file=join(cwd,'preset-compat-'+randomUUID()+'.bin');await writeFile(file,bytes);
 const capState=async()=>{const r=await fetch(base+'/workspace-capabilities/v1/state?workspace='+encodeURIComponent(cwd));assert.equal(r.status,200);return r.json();};
 const capAction=async value=>post('/workspace-capabilities/v1/action',{workspace:cwd,revision:(await capState()).revision,...value});
 const initial=await capState();originalSkill=initial.skills.find(s=>s.name==='native-ui-policy');originalMcp=initial.mcp.find(m=>m.name==='native-ui-mcp');assert.ok(originalSkill&&originalMcp);
 const mcpCount=async()=>(await readFile(join(host,'reports/mcp-called.log'),'utf8').catch(()=>'' )).split('called').length-1;
 async function call(sid,preset,name,args){const from=(await logs()).length;const actual=preset==='ptc'?{name:'run_code',args:{code:'console.log(await tools['+JSON.stringify(name)+']('+JSON.stringify(args)+'));',description:'Run synthetic preset compatibility probe'}}:{name,args};const text='SOUL_CALL:'+JSON.stringify(actual)+'\n'+randomUUID();await prompt(sid,text);return(await logs()).slice(from).find(r=>r.toolResult);}
 for(const preset of['standard','ptc','minimal','cordis']){
  const created=await rpc('session/create',{request:{cwd,agentPreset:preset,sessionId:'session-'+randomUUID()}}),sid=created.sessionId;sessions.push(sid);assert.equal(created.agentPreset,preset);await act('rule-set',{scope:'session',id:sid,target:'persona',rule:{mode:'persona',personaId:persona}});await act('rule-set',{scope:'session',id:sid,target:'children',rule:{mode:'none'}});const row={preset,sessionId:sid,personaModes:[]};
  for(const mode of['priority','complete','append']){await act('settings',{mode});const input=await prompt(sid,'PRESET_'+preset+'_'+mode+'_'+randomUUID());assert.equal(input.identity,'A');assert.equal(input.privateMemory,true);assert.deepEqual(input.systemPersonas,['A']);if(preset==='ptc'){assert.deepEqual(input.tools,['run_code']);assert.ok(input.system.includes('soul_memory_read'));assert.ok(input.system.includes('declare const tools'));}row.personaModes.push(mode);row.modelToolNames=input.tools;}
  await act('settings',{enabled:false});const off=await prompt(sid,'PRESET_OFF_'+preset+'_'+randomUUID());assert.equal(off.identity,'none');assert.equal(off.privateMemory,false);row.masterSwitch=true;await act('settings',{enabled:true,mode:'priority'});
  if(preset!=='minimal'){
   for(const childPolicy of['none','parent']){
    await act('rule-set',{scope:'session',id:sid,target:'children',rule:{mode:childPolicy}});
    const marker='PRESET_CHILD_'+preset+'_'+childPolicy+'_'+randomUUID();
    await call(sid,preset,'subagent',{description:'Synthetic preset persona test',name:'preset-'+childPolicy,prompt:marker});
    const child=await until(async()=>(await logs()).find(r=>r.text===marker||r.text.startsWith(marker+'\n')),'child first request');
    assert.equal(child.identity,childPolicy==='none'?'none':'A');assert.equal(child.privateMemory,childPolicy!=='none');
   }
   row.subagentDefaultNoneAndParentReuse=true;
  }else{assert.ok(!row.modelToolNames.includes('skill')&&!row.modelToolNames.includes('subagent')&&!row.modelToolNames.includes('edit'));row.minimalToolBoundaryPreserved=true;}
  await capAction({action:'rule',kind:'skills',key:'native-ui-policy',value:true});
  const catalog=await rpc('skills/list',{request:{sessionId:sid}});assert.ok(catalog.skills.some(s=>s.name==='native-ui-policy'));
  await capAction({action:'rule',kind:'skills',key:'native-ui-policy',value:false});
  assert.ok(!(await rpc('skills/list',{request:{sessionId:sid}})).skills.some(s=>s.name==='native-ui-policy'));row.skillPolicy=true;
  const memoryRead=await call(sid,preset,'soul_memory_read',{});assert.ok(JSON.stringify(memoryRead?.toolResult).includes('SOUL_PRIVATE_MEMORY'));row.actualMemoryTool=true;
  if(!originalMcp.approved)await capAction({action:'approve',kind:'mcp',key:originalMcp.id,value:true,fingerprint:originalMcp.fingerprint});
  else await capAction({action:'rule',kind:'mcp',key:originalMcp.id,value:true});
  const connected=await until(async()=>{const m=(await capState()).mcp.find(m=>m.id===originalMcp.id);return m.status==='connected'&&m.toolDetails?.length?m:false;},'MCP connected');
  const mcpTool=connected.toolDetails.find(t=>t.name.endsWith('__ping')).name;
  let count=await mcpCount();await call(sid,preset,mcpTool,{});assert.equal(await mcpCount(),count+1);row.actualMcpTool=true;
  await capAction({action:'rule',kind:'mcp',key:originalMcp.id,value:false});count=await mcpCount();
  const blockedInput=await prompt(sid,'DISABLED_MCP_'+preset+'_'+randomUUID());assert.ok(!blockedInput.tools.includes(mcpTool));assert.ok(!blockedInput.system.includes('"'+mcpTool+'"'));
  await call(sid,preset,mcpTool,{});assert.equal(await mcpCount(),count);row.disabledMcpNotAdvertisedAndNotExecuted=true;
  const ticket=await post('/api/file-bridge.prepare',{sessionId:sid,path:file});const downloaded=await fetch(base+ticket.url);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);row.binaryDownloadSha256=createHash('sha256').update(bytes).digest('hex');const evil=await fetch(base+'/api/file-bridge.prepare',{method:'POST',headers:{Origin:'https://untrusted.invalid','Content-Type':'application/json'},body:JSON.stringify({sessionId:sid,path:file})});assert.equal(evil.status,403);row.downloadOriginGuard=true;report.modes.push(row);console.log(JSON.stringify({preset,personaModes:row.personaModes,modelToolNames:row.modelToolNames,download:true}));
 }report.allFourPresetsPassed=true;
}catch(e){report.error=String(e);throw e;}finally{if(cwd&&originalSkill&&originalMcp){const r=await fetch(base+'/workspace-capabilities/v1/state?workspace='+encodeURIComponent(cwd));let v=await r.json();await post('/workspace-capabilities/v1/action',{workspace:cwd,revision:v.revision,action:'rule',kind:'skills',key:originalSkill.name,value:originalSkill.rule}).catch(()=>{});v=await(await fetch(base+'/workspace-capabilities/v1/state?workspace='+encodeURIComponent(cwd))).json();await post('/workspace-capabilities/v1/action',{workspace:cwd,revision:v.revision,action:'rule',kind:'mcp',key:originalMcp.id,value:originalMcp.rule}).catch(()=>{});}if(previous)await act('settings',{enabled:previous.enabled,mode:previous.mode}).catch(()=>{});for(const sessionId of sessions)await rpc('session/archive',{sessionId}).catch(()=>{});await writeFile(join(out,'preset-compatibility.json'),JSON.stringify(report,null,2));}
