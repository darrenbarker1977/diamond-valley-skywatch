// Synthetic orientation exists only in these development tests, never in the app.
import {test,expect} from '@playwright/test';
const pageErrors=new WeakMap();
test.beforeEach(async({page})=>{pageErrors.set(page,[]);page.on('pageerror',error=>pageErrors.get(page).push(error.message));});
test.afterEach(async({page})=>expect(pageErrors.get(page)).toEqual([]));
async function open(page){await page.addInitScript(()=>{for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});await page.clock.install({time:new Date('2026-10-27T03:00:00Z')});await page.clock.pauseAt(new Date('2026-10-27T03:00:10Z'));await page.goto('/prototype/');await page.locator('#launch').click();await page.locator('[data-nav-section=pointing]').click();await page.locator('#location-present').check();await page.locator('#camera-tools').evaluate(el=>el.open=true);}
async function feed(page,{wrong=false,mode='mounted'}={}){
 await page.evaluate(()=>clearInterval(window.__testSensorTimer));
 await page.clock.runFor(300);
 for(let i=0;i<12;i++){
  await page.evaluate(async({wrong,mode})=>{
   const {catalogue}=await import('/prototype/catalogue.js');const {position}=await import('/prototype/positions.js');
   const id=document.getElementById('alignment-target').value,o=catalogue.find(o=>o.id===id),p=position(window.Astronomy,o,new Date());
   const event=new Event('deviceorientationabsolute');window.__testSensorValues={absolute:true,alpha:-(p.az+23+(wrong?15:0)),beta:(mode==='mounted'?0:90)+p.alt,gamma:0};Object.assign(event,window.__testSensorValues);window.dispatchEvent(event);
  },{wrong,mode});await page.clock.runFor(100);
 }
 await page.evaluate(()=>{window.__testSensorTimer=setInterval(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);},50);});
 await page.locator('#object-confirm').check();
}
test('beginner mounted wizard records two objects, checks a third and loses alignment on interruption',async({page},info)=>{
 await open(page);await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();
 await expect(page.locator('#setup-help')).toContainText('physical top edge');
 await expect(page.locator('#alignment-target option').first()).toContainText('Moon');
 await page.locator('#enable-sensors').click();
 await feed(page);await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-step')).toContainText('2 ·');
 await expect(page.locator('#guidance')).toContainText('arrows are off');
 await feed(page);await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-step')).toContainText('3 ·');
 await expect(page.locator('#guidance')).toContainText('arrows are off');
 await feed(page);await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-feedback')).toContainText('check passed');await expect(page.locator('#finder-name')).toHaveText('Moon');
 await expect(page.locator('#measured-direction')).toContainText('Phone-derived tube estimate');
 await expect(page.locator('#guidance')).not.toContainText('arrows are off');
 await page.locator('[data-nav-section=finder]').click();await expect(page.locator('#finder-arrows')).toBeVisible();await expect(page.locator('#finder-horizontal')).not.toHaveText('');await page.locator('[data-nav-section=pointing]').click();
 await page.locator('#guidance').evaluate(el=>{const label=document.createElement('p');label.textContent='SIMULATED DEVELOPMENT TEST — NOT REAL TELESCOPE READINGS.';el.before(label);});
 await page.locator('#guidance').scrollIntoViewIfNeeded();
 await page.screenshot({path:`prototype/screenshots/${info.project.name}-alignment.png`,fullPage:true});
 await page.evaluate(()=>clearInterval(window.__testSensorTimer));await page.clock.runFor(2000);
 await expect(page.locator('#sensor-status')).toContainText('stale');
 await expect(page.locator('#guidance')).toContainText('arrows are off');
 await expect(page.locator('#measured-direction')).toHaveText('No measured direction available.');
 await expect(page.locator('#finder-arrows')).toHaveAttribute('hidden');await expect(page.locator('#finder-horizontal')).toHaveText('');await expect(page.locator('#atlas-follow')).toBeDisabled();
});
test('wrong independent object never unlocks arrows',async({page})=>{
 await open(page);await page.locator('#enable-sensors').click();
 for(let i=0;i<2;i++){await feed(page,{mode:'handheld'});await page.locator('#capture-alignment').click();}
 await feed(page,{mode:'handheld',wrong:true});await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-feedback')).toContainText('Guidance remains off');
 await expect(page.locator('#guidance')).toContainText('arrows are off');
});
test('denied permission and missing absolute events give actionable errors',async({page})=>{
 await page.addInitScript(()=>{window.DeviceOrientationEvent.requestPermission=async()=> 'denied';});
 await open(page);await page.locator('#enable-sensors').click();
 await expect(page.locator('#sensor-status')).toContainText('Permission denied');
 await expect(page.locator('#guidance')).toContainText('arrows are off');
 await page.evaluate(()=>delete window.DeviceOrientationEvent.requestPermission);
 await page.locator('#enable-sensors').click();await page.clock.runFor(6500);
 await expect(page.locator('#sensor-status')).toContainText('No usable absolute');
});
test('relative readings, invalid values, mode change and closed panel cannot supply pointing',async({page})=>{
 await open(page);await page.locator('#enable-sensors').click();
 await page.evaluate(()=>{const e=new Event('deviceorientation');Object.assign(e,{absolute:false,alpha:10,beta:90,gamma:0});window.dispatchEvent(e);});
 await expect(page.locator('#sensor-status')).toContainText('relative');
 await expect(page.locator('#measured-direction')).toHaveText('No measured direction available.');
 await page.evaluate(()=>{const valid=new Event('deviceorientationabsolute');Object.assign(valid,{absolute:true,alpha:0,beta:90,gamma:0});window.dispatchEvent(valid);const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:null,beta:90,gamma:0});window.dispatchEvent(e);});
 await expect(page.locator('#sensor-status')).toContainText('Invalid or missing');
 await page.locator('#pointing-mode').selectOption('mounted');await expect(page.locator('#capture-alignment')).toBeDisabled();
 await page.locator('#close').click();await page.locator('#launch').click();
 await expect(page.locator('#sensor-status')).toHaveText('Sensors off');
});
test('daylight offers no beginner alignment and rear-camera denial is explicit',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Camera permission denied','NotAllowedError');};});
 await open(page);await page.clock.setFixedTime(new Date('2026-10-26T19:00:00Z'));
 await page.locator('#reset-alignment').click();
 await expect(page.locator('#easy-explanation')).toContainText('too bright');
 await expect(page.locator('#alignment-target option')).toHaveCount(0);
 await page.locator('#camera-toggle').click();await expect(page.locator('#camera-status')).toContainText('Camera unavailable');
 await expect(page.locator('#camera-view')).toBeHidden();
});
test('future planning clears checked alignment and never restores it automatically',async({page})=>{
 await page.route('https://api.open-meteo.com/**',route=>route.abort());
 await open(page);await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();await page.locator('#enable-sensors').click();
 for(let i=0;i<3;i++){await feed(page);await page.locator('#capture-alignment').click();}
 await expect(page.locator('#alignment-feedback')).toContainText('check passed');await expect(page.locator('#finder-arrows')).not.toHaveAttribute('hidden');
 await page.locator('[data-nav-section=objects]').click();await page.locator('#plan-night').click();await expect(page.locator('#sensor-status')).toHaveText('Sensors off');await expect(page.locator('#finder-arrows')).toHaveAttribute('hidden');await expect(page.locator('#finder-horizontal')).toHaveText('');await expect(page.locator('#atlas-follow')).toBeDisabled();
 await page.locator('#plan-now').click();await expect(page.locator('#sensor-status')).toHaveText('Sensors off');await expect(page.locator('#finder-arrows')).toHaveAttribute('hidden');await page.evaluate(()=>clearInterval(window.__testSensorTimer));
});
test('closing during camera permission stops a late camera stream',async({page})=>{
 await page.addInitScript(()=>{window.__stoppedTracks=0;navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.__cameraResolve=()=>resolve({getTracks:()=>[{stop:()=>window.__stoppedTracks++}]});});});
 await open(page);await page.locator('#camera-toggle').click();
 await expect(page.locator('#camera-status')).toContainText('Requesting');
 await page.locator('#close').click();await page.evaluate(()=>window.__cameraResolve());
 await expect.poll(()=>page.evaluate(()=>window.__stoppedTracks)).toBe(1);
 await page.locator('#launch').click();await expect(page.locator('#camera-view')).toBeHidden();
});
