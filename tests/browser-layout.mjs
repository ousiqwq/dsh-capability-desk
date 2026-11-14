import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const outputDir=process.env.DSH_TEST_ARTIFACTS || 'test-results';
await mkdir(outputDir,{recursive:true});
const root=(process.env.DSH_TEST_URL || 'http://127.0.0.1:3080').replace(/\/$/, ''),api=root+'/workspace-capabilities/v1';
const browser=await chromium.launch({headless:true,...(process.env.DSH_TEST_CHROME?{executablePath:process.env.DSH_TEST_CHROME}:{}),args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900},colorScheme:'dark',locale:'zh-CN'});
const errors=[],calls=[];page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.method()==='POST'&&request.url()===api+'/translation/tasks')calls.push(request.postDataJSON());});
const view=async()=>{const response=await page.request.get(api+'/state');assert.equal(response.status(),200);return response.json();};
const initial=await view();
async function open(){await page.goto(root);await page.getByRole('button',{name:/^(账号菜单|Account menu)$/}).click();await page.getByText(/^(设置|Settings)$/).click();await page.getByRole('button',{name:'Skill 与 MCP',exact:true}).click();await page.locator('article .wc-translation-actions').first().waitFor();}
try{
 await open();const metrics=[];
 assert.equal(await page.getByRole('textbox',{name:'工作区绝对路径',exact:true}).isVisible(),true);
 assert.equal(await page.locator('.wc-workspace-add').getByRole('button',{name:'添加工作区',exact:true}).isVisible(),true);
 for(const width of [1440,1280,900,775,700,651,650,390,320]){
  await page.setViewportSize({width,height:900});
  const select=await page.getByRole('button',{name:'规则范围',exact:true}).boundingBox(),button=await page.getByRole('button',{name:'重新发现',exact:true}).boundingBox();
  const dimensions=await page.locator('.wc-page').evaluate(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}));
  assert.ok(Math.abs(select.y-button.y)<1,JSON.stringify({width,select,button}));assert.ok(Math.abs(select.height-button.height)<1);assert.ok(button.x>=select.x+select.width+7);assert.ok(dimensions.scrollWidth<=dimensions.width+1,JSON.stringify({width,dimensions}));
  const footer=page.locator('article .wc-item-footer').first(),source=await footer.locator('.wc-item-path').boundingBox(),toggle=await footer.locator('.wc-translate-icon').boundingBox();
  for(const control of[toggle]){assert.equal(control.width,28);assert.equal(control.height,28);assert.ok(Math.abs((source.y+source.height/2)-(control.y+control.height/2))<1);}
  assert.ok(source.x+source.width<toggle.x);assert.equal(await footer.locator('button').count(),2);
  metrics.push({viewport:width,controlHeight:select.height,topDifference:button.y-select.y,footerOrder:'path-clear-translate',icons:28});
 }
 console.log('Responsive alignment:',JSON.stringify(metrics));
 await page.setViewportSize({width:1280,height:900});
 const cached=initial.skills.find(item=>item.translation?.status==='translated');assert.ok(cached,'Need an existing cached translation for the cache-toggle check');
 const card=page.locator('article[data-capability="'+cached.name+'"]'),icon=card.locator('.wc-translate-icon');await card.scrollIntoViewIfNeeded();
 const box=await card.boundingBox(),iconBox=await icon.boundingBox(),style=await card.evaluate(el=>({right:parseFloat(getComputedStyle(el).paddingRight),bottom:parseFloat(getComputedStyle(el).paddingBottom),border:parseFloat(getComputedStyle(el).borderRightWidth)}));
 const footerBox=await card.locator('.wc-item-footer').boundingBox();
 assert.equal(iconBox.width,28);assert.equal(iconBox.height,28);assert.ok(Math.abs(box.x+box.width-style.right-style.border-iconBox.x-iconBox.width)<1);assert.ok(Math.abs(box.y+box.height-style.bottom-style.border-footerBox.y-footerBox.height)<1);
 const source=card.locator('.wc-item-path'),sourceBox=await source.boundingBox(),sourceStyle=await source.evaluate(el=>({fontSize:getComputedStyle(el).fontSize,lineHeight:getComputedStyle(el).lineHeight}));assert.equal(sourceStyle.fontSize,'10px');assert.equal(sourceStyle.lineHeight,'14px');assert.ok(Math.abs((iconBox.y+iconBox.height/2)-(sourceBox.y+sourceBox.height/2))<1);
 assert.equal(await icon.locator('svg path').count(),1);assert.equal(await card.locator('.wc-retranslate-icon').count(),0);assert.equal(await card.locator('.wc-translation-actions').innerText(),'');
 const show=page.getByRole('switch',{name:'显示译文',exact:true});assert.equal(await show.getAttribute('aria-checked'),'true');assert.equal(await card.locator('.wc-translated').count(),1);await show.click();assert.equal(await card.locator('.wc-translated').count(),0);await show.click();assert.equal(await card.locator('.wc-translated').count(),1);assert.equal(calls.length,0,'Automatic cache display and its visibility switch must not call the model');
 await card.screenshot({path:join(outputDir,'capability-desk-card.png')});
 if(process.argv.includes('--retranslate')){
  const [response]=await Promise.all([page.waitForResponse(async result=>result.url().startsWith(api+'/translation/tasks?')&&result.status()===200&&(await result.json()).status==='done',{timeout:110000}),icon.click()]);
  const result=(await response.json()).result;assert.equal(response.status(),200,JSON.stringify(result));assert.equal(calls.length,1);assert.equal(calls[0].force,true);assert.equal(result.cached,false);assert.match(result.view.skills.find(item=>item.name===cached.name).translation.description,/\p{Script=Han}/u);
  const reused=await page.request.post(api+'/translate',{data:{keys:['skill:'+cached.name],force:false}});assert.equal(reused.status(),200);assert.equal((await reused.json()).cached,true);
  console.log('Retranslation replaced cache via current model:',result.model.model,'normal request cache hit: true');
 }
 await open();assert.ok((await view()).skills.find(item=>item.name===cached.name).translation);assert.equal(calls.length,process.argv.includes('--retranslate')?1:0);
 await page.locator('.wc-scope-controls').screenshot({path:join(outputDir,'capability-desk-scope-layout.png')});
 await page.locator('article[data-capability="'+cached.name+'"]').screenshot({path:join(outputDir,'capability-desk-card.png')});
 await page.setViewportSize({width:390,height:844});await page.locator('article[data-capability="'+cached.name+'"]').screenshot({path:join(outputDir,'capability-desk-mobile-card.png')});
 const final=await view();assert.deepEqual(final.discovery,initial.discovery);assert.deepEqual(final.defaults,initial.defaults);assert.equal(final.revision,initial.revision);assert.deepEqual(errors,[]);
 console.log('UI checks passed: aligned controls at 9 widths, path/remove/translate footer, 28px icons, always-visible workspace form, automatic cached display without requests, refresh retains translation, preferences preserved, zero page errors.');
}finally{await browser.close();}
