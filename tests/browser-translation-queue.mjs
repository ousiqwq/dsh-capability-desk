// Mutating browser acceptance is restricted to the isolated native DSH host.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const base='http://127.0.0.1:14086',api=base+'/workspace-capabilities/v1',out='test-results/translation-queue';
const reports='../dsh-soul-desk/test-results/native-host/reports',control=reports+'/translation-control.json',events=reports+'/translation-events.jsonl';
await mkdir(out,{recursive:true});await writeFile(events,'');
const browser=await chromium.launch({executablePath:process.env.DSH_TEST_CHROME,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1440,height:1000},locale:'zh-CN',colorScheme:'dark'}),report={},errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST'&&r.url()===api+'/translation/tasks')requests.push(r.postDataJSON());});
await page.route('**/plugins/**',async route=>{if(!route.request().url().includes('dsh-plugin-workspace-capabilities'))return route.continue();const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('function apply(ctx) {','function apply(ctx) {window.__CAP_MODEL_TEST_CTX__=ctx;')});});
async function until(check){for(let i=0;i<200;i++){if(await check())return;await page.waitForTimeout(75);}throw Error('Translation queue acceptance timed out');}
async function rpc(method,args){const response=await page.request.post(base+'/api/'+method,{headers:{Origin:base},data:{type:'client-request',rpcId:randomUUID(),method,payload:{args}}});const data=await response.json();assert.equal(data.result.ok,true);return data.result.value;}
async function open(){await page.getByRole('button',{name:'账号菜单',exact:true}).click();await page.getByText('设置',{exact:true}).click();await page.getByRole('button',{name:'Skill 与 MCP',exact:true}).click();await until(()=>page.locator('article[data-capability="queue-ui-01"] .wc-translate-icon').isEnabled());}
async function activate(id){await page.waitForFunction(()=>window.__CAP_MODEL_TEST_CTX__);await until(()=>page.evaluate(id=>!!window.__CAP_MODEL_TEST_CTX__.get('sessions').list.getSnapshot().byId[id],id));await page.evaluate(id=>window.__CAP_MODEL_TEST_CTX__.get('uiWorkspace').openSession(id),id);await until(()=>page.evaluate(id=>window.__CAP_MODEL_TEST_CTX__.get('uiSession').current.getSnapshot()?.key===id,id));}
const names=Array.from({length:12},(_,n)=>'queue-ui-'+String(n+1).padStart(2,'0')),card=name=>page.locator('article[data-capability="'+name+'"]');
const readEvents=async()=>(await readFile(events,'utf8')).trim().split('\n').filter(Boolean).map(s=>JSON.parse(s));
let sid;
try {
 await writeFile(control,JSON.stringify({hold:true,fail:['queue-ui-03']}));
 const clear=await page.request.post(api+'/translation/clear',{headers:{Origin:base},data:{keys:names.map(n=>'skill:'+n),uiLocale:'zh'}});assert.equal(clear.status(),200);
 // API transport proves the shared server's eight-call cap independently of the
 // browser's own per-origin HTTP/1 connection limit.
 const serverJobs=names.map(name=>page.request.post(api+'/translate',{headers:{Origin:base},data:{keys:['skill:'+name],selection:{provider:'soul-fixture',model:'fixture'},force:true,uiLocale:'zh'}}));
 const serverAll=Promise.all(serverJobs);await until(async()=>(await readEvents()).filter(e=>e.phase==='start').length===8);assert.equal((await readEvents()).filter(e=>e.phase==='end').length,0);
 await writeFile(control,JSON.stringify({hold:true,release:['queue-ui-01'],fail:['queue-ui-03']}));await until(async()=>(await readEvents()).filter(e=>e.phase==='start').length===9);
 await writeFile(control,JSON.stringify({hold:false,fail:['queue-ui-03']}));const serverResults=await serverAll;assert.equal(serverResults.filter(r=>r.status()===502).length,1);assert.equal(serverResults.filter(r=>r.status()===200).length,11);assert.equal(Math.max(...(await readEvents()).map(e=>e.active)),8);report.sharedServerConcurrency8AndDrain=true;
 await page.request.post(api+'/translation/clear',{headers:{Origin:base},data:{keys:names.map(n=>'skill:'+n),uiLocale:'zh'}});await writeFile(events,'');await writeFile(control,JSON.stringify({hold:true,fail:['queue-ui-03']}));
 await page.goto(base);await page.waitForFunction(()=>window.__CAP_MODEL_TEST_CTX__);
 const fixture=JSON.parse(await readFile('../dsh-soul-desk/test-results/native-host/fixture.json'));
 sid=(await rpc('session/create',{request:{cwd:fixture.space.path,sessionId:'session-'+randomUUID()}})).sessionId;await activate(sid);await open();
 const search=page.getByRole('searchbox',{name:'搜索能力',exact:true});await search.fill('queue-ui-');assert.equal(await page.locator('article[data-capability]').count(),12);
 for(let i=0;i<9;i++)await card(names[i]).locator('.wc-translate-icon').click();
 await until(async()=>(await readEvents()).filter(e=>e.phase==='start').length===8);
 assert.equal(await page.locator('[data-translation-state=translating]').count(),8);assert.equal(await page.locator('[data-translation-state=queued]').count(),1);
 assert.equal(await card(names[9]).locator('.wc-translate-icon').isEnabled(),true);assert.equal(await page.getByRole('button',{name:'规则范围',exact:true}).isEnabled(),true);report.otherItemsAndSettingsStayEnabled=true;
 // A bulk click adds the remaining three, without duplicating any of the nine pending jobs.
 await page.getByRole('button',{name:'翻译当前列表',exact:true}).click();assert.equal(await page.locator('[data-translation-state=queued]').count(),4);assert.equal(requests.length,8);
 const status=page.getByRole('alert').filter({hasText:'翻译任务：'});await status.waitFor();assert.ok((await status.boundingBox()).y<60);await page.screenshot({path:out+'/eight-active-four-queued.png'});
 await writeFile(control,JSON.stringify({hold:true,release:['queue-ui-01'],fail:['queue-ui-03']}));await until(()=>requests.length===9);assert.equal(await page.locator('[data-translation-state=translating]').count(),8);report.finishingOneStartsNextQueuedItem=true;
 await writeFile(control,JSON.stringify({hold:false,fail:['queue-ui-03']}));await until(async()=>await page.locator('[data-translation-state]:not([data-translation-state=idle])').count()===0);
 const log=await readEvents();assert.equal(Math.max(...log.map(e=>e.active)),8);report.browserActualConcurrency=Math.max(...log.map(e=>e.active));assert.equal(log.filter(e=>e.phase==='start').length,12);assert.equal(requests.length,12);assert.equal(new Set(requests.map(r=>r.keys[0])).size,12);report.maxConcurrency8=true;report.pendingClicksDeduplicated=true;
 assert.equal(await page.locator('article .wc-translated').count(),11);assert.equal(await card('queue-ui-03').locator('.wc-translated').count(),0);report.oneFailureDoesNotStopRemainingJobs=true;
 await writeFile(control,JSON.stringify({hold:false}));let response=page.waitForResponse(r=>r.url().startsWith(api+'/translation/tasks?')&&r.status()===200&&r.request().method()==='GET');await card('queue-ui-03').locator('.wc-translate-icon').click();assert.equal((await response).status(),200);await until(()=>card('queue-ui-03').locator('.wc-clear-translation-icon').isEnabled());assert.equal(await page.locator('article .wc-translated').count(),12);report.failedJobRetryWorks=true;
 const first=card(names[0]),last=card(names[11]),lastText=await last.locator('.wc-translated').innerText(),callsBeforeClear=requests.length;
 const clearButton=first.locator('.wc-clear-translation-icon'),translateButton=first.locator('.wc-translate-icon');await clearButton.scrollIntoViewIfNeeded();const c=await clearButton.boundingBox(),t=await translateButton.boundingBox();assert.ok(c.x+c.width<t.x);assert.equal(c.width,28);assert.equal(t.width,28);assert.equal(c.height,28);assert.equal(t.height,28);
 const cleared=page.waitForResponse(r=>r.url()===api+'/translation/clear');await clearButton.click();assert.equal((await cleared).status(),200);await until(async()=>await first.locator('.wc-translated').count()===0);assert.equal(await last.locator('.wc-translated').innerText(),lastText);assert.equal(requests.length,callsBeforeClear);report.clearLeftOfTranslateAndOnlyThisItem=true;
 await page.reload();await activate(sid);await open();await search.fill('queue-ui-');assert.equal(await first.locator('.wc-translated').count(),0);assert.equal(await last.locator('.wc-translated').innerText(),lastText);assert.equal(requests.length,callsBeforeClear);assert.equal(await first.locator('.wc-clear-translation-icon').isDisabled(),true);report.removalAndOtherCacheSurviveReload=true;
 response=page.waitForResponse(r=>r.url().startsWith(api+'/translation/tasks?')&&r.status()===200&&r.request().method()==='GET');await translateButton.click();assert.equal((await response).status(),200);await until(()=>clearButton.isEnabled());assert.equal(await first.locator('.wc-translated').count(),1);assert.equal(requests.at(-1).force,true);report.retranslationAfterClearWorks=true;
 // Context changes discard queued jobs and abort only requests from the old view.
 await writeFile(control,JSON.stringify({hold:true}));for(let i=0;i<9;i++)await card(names[i]).locator('.wc-translate-icon').click();await until(async()=>await page.locator('[data-translation-state=queued]').count()===1);
 await page.evaluate(async sid=>{const r=await window.__CAP_MODEL_TEST_CTX__.get('modelDirectories').directoryFor(sid).select({provider:'soul-fixture',model:'fixture-alt'});if(!r.ok)throw Error('Cannot change isolated model');},sid);
 await until(()=>translateButton.isEnabled());assert.equal(await page.locator('[data-translation-state=queued]').count(),0);report.modelChangeCancelsOldQueue=true;await writeFile(control,JSON.stringify({hold:false}));
 await page.setViewportSize({width:390,height:1000});await first.scrollIntoViewIfNeeded();assert.ok(await first.evaluate(el=>el.scrollWidth<=el.clientWidth));await page.screenshot({path:out+'/queue-mobile-dark.png'});await page.emulateMedia({colorScheme:'light'});await page.screenshot({path:out+'/queue-mobile-light.png'});report.mobileLayoutAndNativeThemes=true;
 assert.deepEqual(errors,[]);report.errors=errors;
} catch(error){report.error=String(error);report.requestCount=requests.length;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
finally {await writeFile(control,JSON.stringify({hold:false}));if(sid)await rpc('session/archive',{sessionId:sid}).catch(()=>{});await writeFile(out+'/browser-translation-queue.json',JSON.stringify(report,null,2));console.log(report);await browser.close();}
