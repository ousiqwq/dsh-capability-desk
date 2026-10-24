import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const outputDir=process.env.DSH_TEST_ARTIFACTS || 'test-results';
await mkdir(outputDir,{recursive:true});
const root=(process.env.DSH_TEST_URL || 'http://127.0.0.1:3080').replace(/\/$/, ''),api=root+'/workspace-capabilities/v1';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900},colorScheme:'dark',locale:'zh-CN'});
const errors=[],calls=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url()===api+'/translate')calls.push(request.postDataJSON());});
const view=async()=>{const response=await page.request.get(api+'/state');assert.equal(response.status(),200);return response.json();};
const initial=await view();
async function open(){await page.goto(root);await page.getByRole('button',{name:/^(账号菜单|Account menu)$/}).click();await page.getByText(/^(设置|Settings)$/).click();await page.getByRole('button',{name:'Skill 与 MCP',exact:true}).click();await page.locator('article .wc-translation-actions').first().waitFor();}
try{
 await open();const metrics=[];
 for(const width of [1440,1280,900,775,700,651,650,390,320]){
  await page.setViewportSize({width,height:900});
  const select=await page.getByRole('combobox',{name:'规则范围',exact:true}).boundingBox(),button=await page.getByRole('button',{name:'重新发现',exact:true}).boundingBox();
  const dimensions=await page.locator('.wc-page').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}));
  assert.ok(Math.abs(select.y-button.y)<1,JSON.stringify({width,select,button}));assert.ok(Math.abs(select.height-button.height)<1);assert.ok(button.x>=select.x+select.width+7);assert.ok(dimensions.scrollWidth<=dimensions.width+1,JSON.stringify({width,dimensions}));
  metrics.push({viewport:width,controlHeight:select.height,topDifference:button.y-select.y});
 }
 console.log('Responsive alignment:',JSON.stringify(metrics));
 await page.setViewportSize({width:1280,height:900});
 const cached=initial.skills.find(item=>item.translation);assert.ok(cached,'Need an existing cached translation for the cache-toggle check');
 const card=page.locator('article[data-capability="'+cached.name+'"]'),icon=card.locator('.wc-translate-icon');await card.scrollIntoViewIfNeeded();
 const box=await card.boundingBox(),iconBox=await icon.boundingBox(),style=await card.evaluate(el=>({right:parseFloat(getComputedStyle(el).paddingRight),bottom:parseFloat(getComputedStyle(el).paddingBottom),border:parseFloat(getComputedStyle(el).borderRightWidth)}));
 assert.equal(iconBox.width,28);assert.equal(iconBox.height,28);assert.ok(Math.abs(box.x+box.width-style.right-style.border-iconBox.x-iconBox.width)<1);assert.ok(Math.abs(box.y+box.height-style.bottom-style.border-iconBox.y-iconBox.height)<1);
 const sourceBox=await card.locator(':scope > .wc-source').first().boundingBox();assert.ok(iconBox.y>=sourceBox.y+sourceBox.height);
 const before=await icon.getAttribute('aria-pressed');await icon.click();assert.notEqual(await icon.getAttribute('aria-pressed'),before);await icon.click();assert.equal(await icon.getAttribute('aria-pressed'),before);assert.equal(calls.length,0,'Viewing cached text must not call the translation endpoint');
 await card.screenshot({path:join(outputDir,'capability-desk-card.png')});
 if(process.argv.includes('--retranslate')){
  const [response]=await Promise.all([page.waitForResponse(result=>result.url()===api+'/translate',{timeout:110000}),card.getByRole('button',{name:'重新翻译 '+cached.name,exact:true}).click()]);
  const result=await response.json();assert.equal(response.status(),200,JSON.stringify(result));assert.equal(calls.length,1);assert.equal(calls[0].force,true);assert.equal(result.cached,false);assert.match(result.view.skills.find(item=>item.name===cached.name).translation.description,/\p{Script=Han}/u);
  const reused=await page.request.post(api+'/translate',{data:{keys:['skill:'+cached.name],force:false}});assert.equal(reused.status(),200);assert.equal((await reused.json()).cached,true);
  console.log('Retranslation replaced cache via current model:',result.model.model,'normal request cache hit: true');
 }
 await open();assert.ok((await view()).skills.find(item=>item.name===cached.name).translation);assert.equal(calls.length,process.argv.includes('--retranslate')?1:0);
 await page.locator('.wc-scope-controls').screenshot({path:join(outputDir,'capability-desk-scope-layout.png')});
 await page.locator('article[data-capability="'+cached.name+'"]').screenshot({path:join(outputDir,'capability-desk-card.png')});
 await page.setViewportSize({width:390,height:844});await page.locator('article[data-capability="'+cached.name+'"]').screenshot({path:join(outputDir,'capability-desk-mobile-card.png')});
 const final=await view();assert.deepEqual(final.discovery,initial.discovery);assert.deepEqual(final.defaults,initial.defaults);assert.equal(final.revision,initial.revision);assert.deepEqual(errors,[]);
 console.log('UI checks passed: aligned controls at 9 widths, compact bottom-right icon, cached toggle without requests, refresh retains translation, preferences preserved, zero page errors.');
}finally{await browser.close();}
