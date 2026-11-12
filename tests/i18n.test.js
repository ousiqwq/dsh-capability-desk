import test from 'node:test';import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import{runInNewContext}from'node:vm';import{zh,en}from'../locales.js';
test('native locale catalogs and client bundle keep every key and placeholder',async()=>{
 assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort());
 for(const key of Object.keys(zh)){assert.ok(en[key]);const params=s=>[...s.matchAll(/\{(p\d+)\}/g)].map(m=>m[1]).sort();assert.deepEqual(params(zh[key]),params(en[key]),key);}
 const client=await readFile(new URL('../client.js',import.meta.url),'utf8'),block=client.match(/\/\* i18n:start \*\/([\s\S]*?)\/\* i18n:end \*\//)[1];
 const sandbox={Intl};runInNewContext(block+';globalThis.testLocale={zh,en,tr,messageText,installLocale};',sandbox);assert.equal(JSON.stringify(sandbox.testLocale.zh),JSON.stringify(zh));assert.equal(JSON.stringify(sandbox.testLocale.en),JSON.stringify(en));
 let active='en',disposed=false;const locale={register:()=>()=>{disposed=true;},getSnapshot:()=>({active}),bind:()=>((key,p={})=>(active==='zh'?zh[key]:en[key]??key).replace(/\{(\w+)\}/g,(m,n)=>n in p?String(p[n]):m))};const stop=sandbox.testLocale.installLocale({locale});
 const key=Object.keys(zh).find(k=>k.includes('{p0}'));const rendered=sandbox.testLocale.tr(key,{p0:'example',p1:'2',p2:'x'});active='zh';assert.ok(sandbox.testLocale.messageText(rendered).includes('example'));assert.equal(sandbox.testLocale.messageText('Unknown user message'),'Unknown user message');stop();assert.equal(disposed,true);
});
