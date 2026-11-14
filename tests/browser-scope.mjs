import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.env.DSH_TEST_URL??'http://127.0.0.1:14086',api=root+'/workspace-capabilities/v1',out=process.env.DSH_TEST_ARTIFACTS??'test-results/native-scope';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.DSH_TEST_CHROME?{executablePath:process.env.DSH_TEST_CHROME}:{}),args:['--no-sandbox']});
const page=await browser.newPage({locale:'zh-CN',colorScheme:'dark',viewport:{width:1440,height:1000}}),errors=[],writes=[];
page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(r.method()==='POST'&&r.url().startsWith(api))writes.push(r.url());});
const state=async()=>{const response=await page.request.get(api+'/state');assert.equal(response.status(),200);return response.json();};
const initial=await state();
try{
 await page.goto(root);await page.waitForTimeout(500);if(await page.getByRole('button',{name:'继续',exact:true}).count())await page.getByRole('button',{name:'继续',exact:true}).click();
 await page.getByRole('button',{name:'账号菜单',exact:true}).click();await page.getByText('设置',{exact:true}).click();await page.getByRole('button',{name:'Skill 与 MCP',exact:true}).click();
 const scope=page.getByRole('button',{name:'规则范围',exact:true});await scope.waitFor();assert.equal(await scope.innerText(),'全局默认');
 await scope.click();const paths=page.locator('.wc-scope-path');assert.ok(await paths.count());const path=await paths.first().innerText(),title=await paths.first().evaluate(el=>el.previousElementSibling.textContent),style=await paths.first().evaluate(el=>({path:parseFloat(getComputedStyle(el).fontSize),title:parseFloat(getComputedStyle(el.previousElementSibling).fontSize),pathColor:getComputedStyle(el).color,titleColor:getComputedStyle(el.previousElementSibling).color}));assert.equal(style.path,11);assert.ok(style.path<style.title);assert.notEqual(style.pathColor,style.titleColor);
 await page.getByRole('menuitem').filter({hasText:path}).click();assert.equal(await scope.innerText(),title);assert.ok(!(await scope.innerText()).includes(path));await page.waitForResponse(r=>{try{return r.url().startsWith(api+'/state?')&&new URL(r.url()).searchParams.get('workspace')===path;}catch{return false;}});
 const metrics=[];
 for(const width of[1440,1280,900,775,700,651,650,390,320]){
  await page.setViewportSize({width,height:1000});const box=await scope.boundingBox(),refresh=await page.getByRole('button',{name:'重新发现',exact:true}).boundingBox(),sizes=await page.locator('.wc-page').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));assert.ok(sizes.scroll<=sizes.width+1);assert.ok(Math.abs(box.y-refresh.y)<1);assert.ok(Math.abs(box.height-refresh.height)<1);assert.ok(box.height<=40);
  await scope.click();const popup=await page.getByRole('menu').boundingBox();assert.ok(popup.x>=-1&&popup.x+popup.width<=width+1,JSON.stringify({width,popup}));await page.keyboard.press('Escape');metrics.push({viewport:width,height:box.height,aligned:true,menuWithinViewport:true});
 }
 await page.setViewportSize({width:1440,height:1000});await scope.click();await page.screenshot({path:out+'/scope-dark.png'});await page.keyboard.press('Escape');await page.emulateMedia({colorScheme:'light'});await scope.click();await page.screenshot({path:out+'/scope-light.png'});await page.keyboard.press('Escape');
 await scope.focus();await page.keyboard.press('Enter');await page.getByRole('menu').waitFor();await page.getByRole('menuitem',{name:'全局默认',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await scope.innerText(),'全局默认');
 const final=await state();assert.deepEqual(final.defaults,initial.defaults);assert.deepEqual(final.discovery,initial.discovery);assert.equal(final.revision,initial.revision);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 const report={nativeMenu:true,collapsedNameOnly:true,expandedPathNote:style,scopeUsesOriginalPath:true,keyboardSelection:true,darkAndLight:true,metrics,noPolicyOrTranslationWrites:true,errors};await writeFile(out+'/scope-report.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
