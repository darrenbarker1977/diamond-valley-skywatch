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
test('beginner mounted wizard refines alignment and pauses arrows when readings go stale',async({page},info)=>{
 await open(page);await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();
 await expect(page.locator('#setup-help')).toContainText('physical top edge');
 await expect(page.locator('#alignment-target option').first()).toContainText('Moon');
 await page.locator('#enable-sensors').click();
 await feed(page);await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-step')).toContainText('2 ·');
 await expect(page.locator('#alignment-feedback')).toContainText('Basic one-target guidance');
 await feed(page);await page.locator('#capture-alignment').click();
 await expect(page.locator('#alignment-step')).toContainText('3 ·');
 await expect(page.locator('#alignment-feedback')).toContainText('Two-target guidance');
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
 await expect(page.locator('#finder-arrows')).toHaveAttribute('hidden');await expect(page.locator('#finder-horizontal')).toHaveText('');await expect(page.locator('#atlas-follow')).toBeEnabled();await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','waiting');
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
 await page.locator('#pointing-setup>summary').click();await page.locator('#pointing-mode').selectOption('mounted');await expect(page.locator('#capture-alignment')).toBeDisabled();
 await page.locator('#close').click();await page.locator('#launch').click();
 await expect(page.locator('#sensor-status')).toHaveText('Sensors off');
});
test('daylight offers no beginner alignment and rear-camera denial is explicit',async({page},info)=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Camera permission denied','NotAllowedError');};});
 await open(page);await page.clock.setFixedTime(new Date('2026-10-26T19:00:00Z'));
 await page.locator('#reset-alignment').click();
 await expect(page.locator('#easy-explanation')).toContainText('too bright');
 await expect(page.locator('#alignment-daylight')).toBeVisible();await expect(page.locator('#alignment-daylight')).toContainText('This is expected');await expect(page.locator('#alignment-step')).toContainText('Waiting for dusk');await expect(page.locator('#capture-alignment')).toHaveText('Alignment available after dusk');await page.locator('#alignment-daylight').scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/skywatch-${info.project.name}-daylight-alignment.png`});
 await expect(page.locator('#alignment-target')).toBeDisabled();
 await expect(page.locator('#alignment-target')).toContainText('Available after dusk');
 await expect(page.locator('#object-confirm')).toBeDisabled();
 await page.locator('#alignment-search').fill('North Star');await expect(page.locator('#alignment-search-status')).toContainText('after dusk');await expect(page.locator('#capture-alignment')).toBeDisabled();
 await page.locator('#camera-toggle').click();await expect(page.locator('#camera-status')).toContainText('Camera unavailable');
 await expect(page.locator('#camera-view')).toBeHidden();
 await page.locator('[data-nav-section=finder]').click();await expect(page.locator('#finder-guide-text')).toContainText('Alignment is paused until after dusk');await expect(page.locator('#finder-arrows')).toBeHidden();await page.locator('[data-nav-section=pointing]').click();await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));await page.locator('#reset-alignment').click();await expect(page.locator('#alignment-daylight')).toBeHidden();await expect(page.locator('#alignment-target')).toBeEnabled();await expect(page.locator('#capture-alignment')).toHaveText('Record first object · start guidance');
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

test('one real target starts basic guidance, Polaris works, and a second refines it',async({page})=>{
 await open(page);await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();await page.locator('#enable-sensors').click();await page.locator('#alignment-target').selectOption('Polaris');await feed(page);await page.locator('#capture-alignment').click();await expect(page.locator('#alignment-feedback')).toContainText('Basic one-target guidance');await expect(page.locator('#measured-direction')).toContainText('One-target basic alignment');await page.locator('#alignment-find').click();await expect(page.locator('#finder-session')).toContainText('ONE-TARGET BASIC');await expect(page.locator('#finder-arrows')).toBeVisible();
 await page.locator('[data-nav-section=pointing]').click();await feed(page);await page.locator('#capture-alignment').click();await expect(page.locator('#alignment-feedback')).toContainText('Two-target guidance');await page.locator('#alignment-find').click();await expect(page.locator('#finder-session')).toContainText('TWO-TARGET REFINED');await expect(page.locator('#finder-arrows')).toBeVisible();
 await page.evaluate(()=>clearInterval(window.__testSensorTimer));await page.clock.runFor(2000);await expect(page.locator('#finder-arrows')).toBeHidden();await page.locator('[data-nav-section=pointing]').click();await feed(page);await expect(page.locator('#measured-direction')).toContainText('Two-target refined alignment');
});

test('alignment search filters real choices, accepts North Star, and clears for the next stage',async({page},info)=>{
 await open(page);await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();await page.locator('#enable-sensors').click();
 const search=page.locator('#alignment-search'),select=page.locator('#alignment-target');
 await search.fill('north STAR');await expect(select.locator('option')).toHaveCount(1);await expect(select).toHaveValue('Polaris');await expect(page.locator('#identify-help')).toContainText('North Star');
 await search.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/skywatch-${info.project.name}-alignment-search.png`});
 await feed(page);await page.clock.runFor(11000);await expect(search).toHaveValue('north STAR');await expect(select).toHaveValue('Polaris');
 await page.locator('#capture-alignment').click();await expect(page.locator('#alignment-feedback')).toContainText('Basic one-target guidance');await expect(search).toHaveValue('');await expect(select).not.toHaveValue('Polaris');await expect(select).toBeEnabled();
 await search.fill('Not a real star');await expect(select).toBeDisabled();await expect(select).toContainText('No matches');await expect(page.locator('#object-confirm')).toBeDisabled();await expect(page.locator('#capture-alignment')).toBeDisabled();await expect(page.locator('#alignment-find')).toBeVisible();
 await search.fill('');await expect(select).toBeEnabled();await expect(page.locator('#object-confirm')).not.toBeChecked();
});

test('changing a typed alignment choice clears confirmation and general search stays available',async({page})=>{
 await open(page);await expect(page.locator('#alignment-search')).toBeVisible();await expect(page.locator('#capture-alignment')).toBeDisabled();await page.locator('#object-confirm').check();await page.locator('#alignment-search').fill('Polaris');await expect(page.locator('#object-confirm')).not.toBeChecked();await expect(page.locator('#alignment-target')).toHaveValue('Polaris');
 await page.locator('#alignment-search').fill('Saturn');await expect(page.locator('#alignment-target')).toHaveValue('Saturn');await page.locator('#alignment-browse').click();await expect(page.locator('#object-library')).toHaveAttribute('open');await expect(page.locator('#search')).toBeFocused();await page.locator('#search').fill('M31');await expect(page.locator('#objects button').first()).toContainText('Andromeda');
});

// Local development-only media. Production never creates a synthetic camera or pose.
async function cameraMock(page){
 await page.addInitScript(()=>{window.__cameraStops=0;navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');ctx.fillStyle='#102438';ctx.fillRect(0,0,640,480);ctx.fillStyle='#b7d9df';ctx.font='22px sans-serif';ctx.fillText('SIMULATED TEST CAMERA',110,70);const stream=c.captureStream(0),track=stream.getVideoTracks()[0];track.getSettings=()=>({facingMode:'environment'});const stop=track.stop.bind(track);track.stop=()=>{window.__cameraStops++;stop();};window.__cameraTrack=track;return stream;};HTMLMediaElement.prototype.play=async()=>{};});
}
async function cameraFits(page){
 const rects=await page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};return {video:rect('camera'),confirm:rect('object-confirm'),record:rect('capture-alignment'),width:innerWidth,height:innerHeight};});
 for(const name of ['video','confirm','record']){expect(rects[name].height).toBeGreaterThan(10);expect(rects[name].top).toBeGreaterThanOrEqual(0);expect(rects[name].bottom).toBeLessThanOrEqual(rects.height);expect(rects[name].left).toBeGreaterThanOrEqual(0);expect(rects[name].right).toBeLessThanOrEqual(rects.width);}
}
test('camera keeps confirmation and Record in view, records one point, then restores controls on Escape',async({page},info)=>{
 await cameraMock(page);await open(page);await page.locator('#enable-sensors').click();const original=await page.locator('#object-confirm').evaluateHandle(el=>el);await page.locator('#camera-toggle').click();await expect(page.locator('#camera-view')).toBeVisible();await expect(page.locator('#camera-action-slot #object-confirm')).not.toBeChecked();await expect(page.locator('#capture-alignment')).toBeDisabled();
 await feed(page,{mode:'handheld'});await cameraFits(page);await expect(page.locator('#camera-object')).toContainText('Moon');await expect(page.locator('#camera-action-slot #capture-alignment')).toBeEnabled();await page.locator('#capture-alignment').click();await expect(page.locator('#camera-view #alignment-feedback')).toContainText('Basic one-target guidance');await expect(page.locator('#camera-view #alignment-find')).toBeVisible();
 await page.screenshot({path:`/tmp/skywatch-${info.project.name}-camera-record.png`});await page.keyboard.press('Escape');await expect(page.locator('#camera-view')).toBeHidden();await expect(page.locator('#navigator')).toBeVisible();await expect(page.locator('#alignment-actions-home #object-confirm')).toHaveCount(1);expect(await page.locator('#object-confirm').evaluate((el,original)=>el===original,original)).toBe(true);expect(await page.evaluate(()=>window.__cameraStops)).toBe(1);await expect(page.locator('#guidance')).toContainText('Basic one-target estimate');
});
test('camera record controls stay beside the video on a short landscape screen',async({page})=>{
 await page.setViewportSize({width:915,height:412});await cameraMock(page);await open(page);await page.locator('#enable-sensors').click();await page.locator('#camera-toggle').click();await feed(page,{mode:'handheld'});await cameraFits(page);await page.locator('#camera-exit').click();await expect(page.locator('#camera-view')).toBeHidden();await expect(page.locator('#camera-toggle')).toBeFocused();expect(await page.evaluate(()=>window.__cameraStops)).toBe(1);
});
test('a lost camera stream restores normal controls and cannot leave a frozen aiming view',async({page})=>{
 await cameraMock(page);await open(page);await page.locator('#camera-toggle').click();await expect(page.locator('#camera-view')).toBeVisible();await expect(page.locator('#capture-alignment')).toBeDisabled();await page.evaluate(()=>window.__cameraTrack.dispatchEvent(new Event('ended')));await expect(page.locator('#camera-view')).toBeHidden();await expect(page.locator('#camera-status')).toContainText('Camera stream ended');await expect(page.locator('#alignment-actions-home #capture-alignment')).toBeDisabled();
});
test('map follow has a separate visible control, explains lost readings, and needs real alignment',async({page})=>{
 await open(page);await page.locator('[data-nav-section=objects]').click();await expect(page.locator('#atlas-follow')).toBeVisible();await expect(page.locator('#atlas-follow')).toBeDisabled();await expect(page.locator('#atlas-follow-state')).toContainText('compass alone');await expect(page.locator('#atlas-live-badge')).toContainText('LIVE TIME');await page.locator('.atlas-follow-guide>summary').click();await expect(page.locator('.atlas-follow-guide')).toContainText('indoor');
 await page.locator('#atlas-align').click();await page.locator('#enable-sensors').click();await feed(page,{mode:'handheld'});await page.locator('#capture-alignment').click();await page.locator('[data-nav-section=objects]').click();await expect(page.locator('#atlas-follow-state')).toContainText('Aligned phone ready');await page.locator('#atlas-follow').click();await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#atlas-follow-state')).toContainText('Following your aligned phone');await page.evaluate(()=>clearInterval(window.__testSensorTimer));await page.clock.runFor(2000);await expect(page.locator('#atlas-follow')).toBeEnabled();await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','paused');await expect(page.locator('#atlas-follow-state')).toContainText('Resumes automatically');await expect(page.locator('#atlas-direction')).toHaveText('Follow paused · last map view');await expect(page.locator('#finder-arrows')).toBeHidden();
 await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);});await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','following');await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#finder-arrows')).toBeHidden();
 await page.clock.runFor(2000);await page.locator('#atlas-follow').click();await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','false');await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);});await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','false');
});

for(const mode of ['handheld','mounted'])test(`phone follow stays enabled during ${mode} movement while arrow stability remains separate`,async({page})=>{
 await open(page);if(mode==='mounted'){await page.locator('#pointing-mode').selectOption('mounted');await page.locator('#mount-confirm').check();}await page.locator('#enable-sensors').click();await feed(page,{mode});await page.locator('#capture-alignment').click();await page.locator('[data-nav-section=objects]').click();await page.locator('#atlas-follow').click();await page.clock.runFor(50);await expect(page.locator('#sky-canvas')).toHaveAttribute('data-ready','true');const before=await page.locator('#sky-canvas').getAttribute('data-azimuth');await page.evaluate(()=>{clearInterval(window.__testSensorTimer);window.__motionBase={...window.__testSensorValues};});
 for(let n=1;n<=16;n++){
  await page.evaluate(n=>{window.__testSensorValues={...window.__motionBase,alpha:window.__motionBase.alpha-n*2};const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);},n);await page.clock.runFor(50);await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','following');
 }
 const after=await page.locator('#sky-canvas').getAttribute('data-azimuth');expect(Math.abs(((Number(after)-Number(before)+540)%360)-180)).toBeGreaterThan(25);await expect(page.locator('#guidance')).toContainText('Hold steady');await expect(page.locator('#finder-arrows')).toBeHidden();
 const last=await page.locator('#sky-canvas').getAttribute('data-azimuth');await page.clock.runFor(2000);await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','paused');await expect(page.locator('#sky-canvas')).toHaveAttribute('data-azimuth',last);await expect(page.locator('#measured-direction')).toHaveText('No measured direction available.');
 await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);});await expect(page.locator('#atlas-card')).toHaveAttribute('data-phone-follow','following');await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','true');
 await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:null,beta:90,gamma:0});window.dispatchEvent(e);});await expect(page.locator('#atlas-follow')).toHaveAttribute('aria-pressed','false');await expect(page.locator('#atlas-follow')).toBeDisabled();await expect(page.locator('#atlas-follow-state')).toContainText('Repeat alignment');
 await page.evaluate(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,window.__testSensorValues);window.dispatchEvent(e);});await expect(page.locator('#atlas-follow')).toBeDisabled();
});
