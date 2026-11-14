// Only the isolated native host and synthetic model are used.
import assert from'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{randomUUID}from'node:crypto';import{resolve,join}from'node:path';
const base='http://127.0.0.1:14086',host=resolve('../dsh-soul-desk/test-results/native-host'),out=resolve('test-results/preset-release-20261114');
async function post(path,data){const r=await fetch(base+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(data)});const v=await r.json();assert.equal(r.status,200,JSON.stringify(v));return v;}
async function rpc(method,args){const r=await post('/api/'+method,{type:'client-request',rpcId:randomUUID(),method,payload:{args}});assert.equal(r.result.ok,true,JSON.stringify(r));return r.result.value;}
const state=async()=>fetch(base+'/private-soul/v2/state').then(r=>r.json());async function soul(action,data){return post('/private-soul/v2/action',{action,data,expectedRevision:(await state()).revision});}
const log=async()=>(await readFile(join(host,'reports/model-requests.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(s=>JSON.parse(s));
async function until(check){for(let n=0;n<200;n++){const v=await check();if(v)return v;await new Promise(r=>setTimeout(r,75));}throw Error('Skill compatibility timeout');}
async function prompt(id,text){const from=(await log()).length;await rpc('session/prompt',{request:{sessionId:id,requestId:randomUUID(),mode:'queue',content:[{type:'text',text}]}});await until(async()=>!(await rpc('session/list',{_request:{}})).items.find(s=>s.sessionId===id)?.running&&(await log()).length>from);return(await log()).slice(from);}
const fixture=JSON.parse(await readFile(join(host,'fixture.json'),'utf8')),cwd=fixture.space.path;const cap=async()=>fetch(base+'/workspace-capabilities/v1/state?workspace='+encodeURIComponent(cwd)).then(r=>r.json());async function enabled(value){return post('/workspace-capabilities/v1/action',{workspace:cwd,revision:(await cap()).revision,action:'rule',kind:'skills',key:'native-ui-policy',value});}
const old=await state(),oldRule=(await cap()).skills.find(s=>s.name==='native-ui-policy').rule,report={rows:[]},sessions=[];
try{
 const persona=(await soul('persona-save',{name:'PTC Skill injection fixture',soul:'SOUL_PERSONA_A',activate:false})).personaId;await soul('memory-save',{personaId:persona,kind:'preference',content:'用户喜欢 SOUL_PRIVATE_MEMORY 合成验收。'});await soul('settings',{enabled:true});
 for(const preset of['standard','ptc'])for(const mode of['priority','complete','append']){
  await soul('settings',{mode});await enabled(true);const id=(await rpc('session/create',{request:{cwd,agentPreset:preset,sessionId:'session-'+randomUUID()}})).sessionId;sessions.push(id);await soul('rule-set',{scope:'session',id,target:'persona',rule:{mode:'persona',personaId:persona}});
  const marker='ENABLED_SKILL_'+randomUUID(),first=(await prompt(id,marker)).find(r=>r.text===marker);assert.equal(first.identity,'A');assert.equal(first.privateMemory,true);assert.match(first.skillCatalog,/- `native-ui-policy`:/);if(preset==='ptc'){assert.deepEqual(first.tools,['run_code']);assert.ok(first.system.includes('skill'));}else assert.ok(first.tools.includes('skill'));
  const call=preset==='ptc'?{name:'run_code',args:{code:'console.log(await tools.skill({name:"native-ui-policy"}));',description:'Read a permitted synthetic skill'}}:{name:'skill',args:{name:'native-ui-policy'}};
  const loaded=await prompt(id,'SOUL_CALL:'+JSON.stringify(call)+'\n'+randomUUID());assert.ok(loaded.some(r=>JSON.stringify(r.toolResult??'').includes('Synthetic acceptance fixture only.')));
  await enabled(false);const disabled='DISABLED_SKILL_'+randomUUID(),next=(await prompt(id,disabled)).find(r=>r.text===disabled);assert.ok(!next.skillCatalog.includes('- `native-ui-policy`:'));
  const denied=await prompt(id,'SOUL_CALL:'+JSON.stringify(call)+'\n'+randomUUID());assert.ok(denied.some(r=>r.toolResult));assert.ok(!denied.some(r=>JSON.stringify(r.toolResult??'').includes('Synthetic acceptance fixture only.')));
  report.rows.push({preset,mode,enabledSkillCatalogInjected:true,fullSkillInstructionsLoaded:true,personaAndMemoryInjected:true,disabledSkillHiddenAndDenied:true});console.log(JSON.stringify(report.rows.at(-1)));
 }
 report.passed=true;
}finally{await enabled(oldRule);await soul('settings',{enabled:old.enabled,mode:old.mode});for(const sessionId of sessions)await rpc('session/archive',{sessionId}).catch(()=>{});await writeFile(join(out,'ptc-skill-injection.json'),JSON.stringify(report,null,2));}
