// All orientation samples here are synthetic development inputs, never app fallbacks.
import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
async function open(page){
 await page.addInitScript(()=>{localStorage.setItem('dvsky:compass:auto:v2','off');for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});
 await page.clock.install({time:new Date('2026-10-27T03:00Z')});await page.goto('/');await page.locator('#launch').click();await page.locator('#search').fill('Polaris');await page.locator('#objects button').click();return page.locator('#detail .live-phone-compass');
}
async function sample(page,{alpha=270,beta=0,gamma=0,absolute=true}={}){
 await page.evaluate(values=>{const event=new Event('deviceorientationabsolute');Object.assign(event,values);window.dispatchEvent(event);},{alpha,beta,gamma,absolute});
}
test.describe('manual compass controls',()=>{
 test.use({hasTouch:false,isMobile:false});
test('live compass uses absolute top-edge heading and hides stale, vertical and relative readings',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const compass=await open(page),heading=compass.locator('.phone-compass-heading'),button=compass.getByRole('button');
 await expect(compass.locator('figcaption')).toHaveText('Live phone compass');await expect(heading).toHaveText('—');
 await button.click();await sample(page,{absolute:false});await expect(heading).toHaveText('—');await expect(compass.locator('.phone-compass-status')).toContainText('relative');await expect(page.locator('#finder-arrows')).toBeHidden();
 await sample(page);await expect(heading).toHaveText('90° E');await expect(compass.locator('svg')).toHaveCSS('transform','matrix(0, -1, 1, 0, 0, 0)');
 await page.clock.runFor(150);await sample(page,{alpha:1});await expect(heading).toHaveText('359° N');
 await page.clock.runFor(150);await sample(page,{alpha:0});await expect(heading).toHaveText('0° N');
 await page.clock.runFor(150);await sample(page,{alpha:0,beta:89});await expect(heading).toHaveText('—');await expect(compass.locator('.phone-compass-status')).toContainText('near vertical');
 await page.clock.runFor(150);await sample(page,{alpha:40,beta:15});await expect(heading).toHaveText('320° NW');
 await compass.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/skywatch-${info.project.name}-live-compass.png`,fullPage:true});
 await page.locator('#night').click();await sample(page,{alpha:40,beta:15});const fill=await compass.locator('.compass-north').evaluate(el=>getComputedStyle(el).fill);const rgb=fill.match(/\d+/g).map(Number);expect(rgb[0]).toBeGreaterThan(rgb[1]);expect(rgb[0]).toBeGreaterThan(rgb[2]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.clock.runFor(900);await expect(heading).toHaveText('—');await page.clock.runFor(1000);await expect(compass.locator('.phone-compass-status')).toContainText('stale');await expect(button).toHaveText('Start compass');expect(errors).toEqual([]);
});
test('compass stops when hidden, keeps permission separate and never unlocks telescope arrows',async({page})=>{
 const compass=await open(page);await compass.getByRole('button').click();await sample(page);await expect(compass).toHaveAttribute('data-state','live');
 await page.clock.runFor(10100);await expect(compass.getByRole('button')).toHaveText('Start compass');await compass.getByRole('button').click();await sample(page);await expect(compass).toHaveAttribute('data-state','live');
 await page.locator('#selected-panel>summary').click();await expect(compass.locator('button')).toHaveText('Start compass');await page.locator('#selected-panel>summary').click();await expect(compass.locator('.phone-compass-heading')).toHaveText('—');
 await compass.getByRole('button').click();await sample(page);await page.locator('[data-nav-section=finder]').click();await expect(page.locator('#finder-arrows')).toBeHidden();await expect(page.locator('#finder-horizontal')).toHaveText('');await page.locator('[data-nav-section=pointing]').click();await expect(page.locator('#sensor-status')).toHaveText('Sensors off');
 await page.locator('[data-nav-section=objects]').click();await expect(compass.getByRole('button')).toHaveText('Start compass');
 await compass.getByRole('button').click();await sample(page);await page.locator('#nav-to-forecast').click();await expect(compass.locator('.phone-compass-heading')).toHaveText('—');
});
test('permission denial, absent sensors and no samples show useful errors, never a bearing',async({page})=>{
 await page.addInitScript(()=>{window.DeviceOrientationEvent=class{static requestPermission(){return Promise.resolve('denied');}};});const compass=await open(page);
 await compass.getByRole('button').click();await expect(compass.locator('.phone-compass-status')).toContainText('Permission denied');await expect(compass.locator('.phone-compass-heading')).toHaveText('—');
 await page.evaluate(()=>{window.DeviceOrientationEvent=undefined;});await compass.getByRole('button').click();await expect(compass.locator('.phone-compass-status')).toContainText('does not expose');
 await page.evaluate(()=>{window.DeviceOrientationEvent=class{};});await compass.getByRole('button').click();await page.clock.runFor(6500);await expect(compass.locator('.phone-compass-status')).toContainText('No usable absolute');await expect(compass.locator('.phone-compass-heading')).toHaveText('—');
});

test('continuous sensor updates survive sky refresh and switching target clears compass',async({page})=>{
 const compass=await open(page);await compass.getByRole('button').click();await sample(page);
 await page.evaluate(()=>{window.__compassTestTimer=setInterval(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:270,beta:0,gamma:0});window.dispatchEvent(e);},100);});
 await page.clock.runFor(10100);await expect(compass.locator('.phone-compass-heading')).toHaveText('90° E');await expect(compass.getByRole('button')).toBeFocused();
 await page.locator('#search').fill('Vega');await page.locator('#objects button').click();await expect(compass.locator('.phone-compass-heading')).toHaveText('90° E');
 await page.locator('#search').fill('Moon');await page.locator('#objects button').click();await expect(page.locator('#detail .live-phone-compass')).toHaveCount(0);
 await page.locator('#search').fill('Polaris');await page.locator('#objects button').click();await expect(compass.locator('.phone-compass-heading')).toHaveText('—');await page.evaluate(()=>clearInterval(window.__compassTestTimer));
});

test('header compass works across all pages and closing it keeps the live dial running',async({page},info)=>{
 await page.addInitScript(()=>{localStorage.setItem('dvsky:compass:auto:v2','off');for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});
 await page.clock.install({time:new Date('2026-10-27T03:00Z')});await page.route('https://api.open-meteo.com/**',r=>r.abort());await page.goto('/');
 const shortcut=page.locator('#compass-launch'),panel=page.locator('#phone-compass-dialog');await expect(shortcut).toBeVisible();await shortcut.click();await expect(panel).toBeVisible();await expect(page.locator('#home-view')).toBeVisible();
 await panel.locator('.phone-compass-toggle').click();await sample(page);await expect(shortcut).toHaveAttribute('data-state','live');await expect(panel.locator('.phone-compass-heading')).toHaveText('90° E');
 await page.evaluate(()=>{window.__compassTestTimer=setInterval(()=>{const e=new Event('deviceorientationabsolute');Object.assign(e,{absolute:true,alpha:270,beta:0,gamma:0});window.dispatchEvent(e);},100);});
 await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(shortcut).toBeFocused();await page.clock.runFor(1000);await expect(shortcut).toHaveAttribute('data-state','live');
 await page.locator('#nav-to-forecast').click();await expect(page.locator('#forecast-view')).toBeVisible();await page.clock.runFor(1000);await expect(shortcut).toHaveAttribute('data-state','live');
 await shortcut.click();await expect(panel.locator('.phone-compass-heading')).toHaveText('90° E');await page.locator('#compass-night').click();await expect(page.locator('body')).toHaveClass(/dv-nav-night/);await page.locator('#compass-close').click();
 await page.locator('#launch').click();await expect(page.locator('#navigator')).toBeVisible();await page.clock.runFor(1000);await expect(shortcut).toHaveAttribute('data-state','live');await page.locator('#search').fill('Polaris');await page.locator('#objects button').click();await expect(page.locator('#detail .phone-compass-heading')).toHaveText('90° E');await shortcut.click();await expect(panel.locator('.phone-compass-heading')).toHaveText('90° E');await page.keyboard.press('Escape');await expect(page.locator('#navigator')).toBeVisible();
 const box=await shortcut.boundingBox(),art=await page.locator('.dv-brand-art').boundingBox();expect(box.width).toBe(44);expect(box.x+box.width<=art.x||box.y>=art.y+art.height).toBe(true);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/skywatch-${info.project.name}-header-compass.png`});
 await shortcut.click();await panel.locator('.phone-compass-toggle').click();await expect(shortcut).toHaveAttribute('data-state','off');await expect(panel.locator('.phone-compass-heading')).toHaveText('—');await panel.locator('.phone-compass-toggle').click();await page.clock.runFor(150);await page.locator('#compass-close').click();await page.locator('#app-header [data-app-view=home]').click();await page.clock.runFor(1000);await expect(shortcut).toHaveAttribute('data-state','live');await shortcut.click();await panel.locator('.phone-compass-toggle').click();await page.evaluate(()=>clearInterval(window.__compassTestTimer));
});

});

test.describe('automatic compass on phones',()=>{
 test.use({userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
 async function phone(page){
  await page.addInitScript(()=>{for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});
  await page.clock.install({time:new Date('2026-10-27T03:00Z')});await page.route('https://api.open-meteo.com/**',r=>r.abort());await page.goto('/');
 }
 test('starts on load, resumes with fresh samples and stops only for this visit',async({page})=>{
  await phone(page);const header=page.locator('#compass-launch'),panel=page.locator('#phone-compass-dialog');
  await expect(header).toHaveAttribute('data-state','waiting');await sample(page);await expect(header).toHaveAttribute('data-state','live');await expect(header).toHaveAttribute('aria-label',/90 degrees/);
  await expect(page.locator('#sensor-status')).toHaveText('Sensors off');await expect(page.locator('#finder-arrows')).toBeHidden();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await expect(header).toHaveAttribute('data-state','paused');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await expect(header).toHaveAttribute('data-state','waiting');await sample(page,{alpha:180});await expect(header).toHaveAttribute('aria-label',/180 degrees/);
  await page.locator('#launch').click();await sample(page,{alpha:180});await expect(header).toHaveAttribute('data-state','live');
  await page.locator('[data-nav-section=finder]').click();await page.locator('#finder-scope-view').click();await expect(header).toHaveAttribute('data-state','paused');await page.locator('#scope-exit').click();await expect(header).toHaveAttribute('data-state','waiting');await sample(page);await expect(header).toHaveAttribute('data-state','live');await expect(page.locator('#finder-arrows')).toBeHidden();
  await header.click();await panel.locator('.phone-compass-toggle').click();await expect(header).toHaveAttribute('data-state','off');await page.reload();await expect(header).toHaveAttribute('data-state','waiting');await sample(page);await expect(header).toHaveAttribute('data-state','live');
  await header.click();await expect(panel.locator('.phone-compass-toggle')).toHaveText('Stop compass');await sample(page);await expect(header).toHaveAttribute('data-state','live');await page.reload();await expect(header).toHaveAttribute('data-state','waiting');await sample(page);await expect(header).toHaveAttribute('data-state','live');
 });
 test('gesture-only browsers never request permission until tapped',async({page})=>{
  await page.addInitScript(()=>{window.__permissionCalls=0;window.DeviceOrientationEvent=class{static requestPermission(){window.__permissionCalls++;return Promise.resolve('granted');}};});
  await phone(page);const header=page.locator('#compass-launch'),panel=page.locator('#phone-compass-dialog');await expect(header).toHaveAttribute('data-state','gesture');expect(await page.evaluate(()=>window.__permissionCalls)).toBe(0);
  await header.click();await expect(panel.locator('.phone-compass-status')).toContainText('Tap Start compass once');expect(await page.evaluate(()=>window.__permissionCalls)).toBe(0);
  await panel.locator('.phone-compass-toggle').click();expect(await page.evaluate(()=>window.__permissionCalls)).toBe(1);await sample(page);await expect(header).toHaveAttribute('data-state','live');
 });
 test('missing startup stream retries once on a real site tap, with no retry loop',async({page})=>{
  await phone(page);const header=page.locator('#compass-launch');await page.clock.runFor(6500);await expect(header).toHaveAttribute('data-state','unreliable');await expect(page.locator('#phone-compass-dialog .phone-compass-status')).toContainText('No usable absolute');
  await page.locator('#night').evaluate(el=>el.click());await page.clock.runFor(1000);await expect(header).toHaveAttribute('data-state','unreliable');
  await header.click();await expect(header).toHaveAttribute('data-state','waiting');await page.clock.runFor(6500);await expect(header).toHaveAttribute('data-state','unreliable');await page.locator('#compass-close').click();await header.click();await expect(header).toHaveAttribute('data-state','unreliable');
  await page.locator('#phone-compass-dialog .phone-compass-toggle').click();await sample(page);await expect(header).toHaveAttribute('data-state','live');await page.clock.runFor(2000);await expect(header).toHaveAttribute('data-state','unreliable');await page.locator('#compass-close').click();await expect(header).toHaveAttribute('data-state','unreliable');
 });
 test('only the explicit auto-start setting persists an off choice',async({page})=>{
  await phone(page);const header=page.locator('#compass-launch');await header.click();const option=page.locator('#compass-auto');await expect(option).toBeChecked();await option.uncheck();await expect(header).toHaveAttribute('data-state','off');await page.reload();await expect(header).toHaveAttribute('data-state','off');
  await header.click();await expect(option).not.toBeChecked();await option.check();await sample(page);await expect(header).toHaveAttribute('data-state','live');await page.reload();await expect(header).toHaveAttribute('data-state','waiting');await sample(page);await expect(header).toHaveAttribute('data-state','live');
 });
 test('the first site tap retries a withheld stream before the startup timeout',async({page})=>{
  await page.addInitScript(()=>{window.__compassStarts=0;const add=window.addEventListener;window.addEventListener=function(name,...args){if(name==='deviceorientationabsolute')window.__compassStarts++;return add.call(this,name,...args);};});
  await phone(page);const starts=await page.evaluate(()=>window.__compassStarts);await expect(page.locator('#compass-launch')).toHaveAttribute('data-state','waiting');await page.locator('#launch').click();expect(await page.evaluate(()=>window.__compassStarts)).toBe(starts+1);await page.locator('[data-nav-section=finder]').click();expect(await page.evaluate(()=>window.__compassStarts)).toBe(starts+1);await sample(page);await expect(page.locator('#compass-launch')).toHaveAttribute('data-state','live');await expect(page.locator('#finder-arrows')).toBeHidden();
 });
 test.describe('phones in desktop browser mode',()=>{
  test.use({userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',hasTouch:true,isMobile:true});
  test('touch input enables auto-start despite desktop identity and an old Stop preference',async({page})=>{
   await page.addInitScript(()=>{localStorage.setItem('dvsky:compass:auto:v1','off');});await phone(page);await expect(page.locator('#compass-launch')).toHaveAttribute('data-state','waiting');await sample(page);await expect(page.locator('#compass-launch')).toHaveAttribute('data-state','live');await page.locator('#compass-launch').click();await expect(page.locator('#compass-auto')).toBeChecked();
  });
 });
});
