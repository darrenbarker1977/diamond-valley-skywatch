// All orientation samples here are synthetic development inputs, never app fallbacks.
import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
async function open(page){
 await page.addInitScript(()=>{for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});
 await page.clock.install({time:new Date('2026-10-27T03:00Z')});await page.goto('/');await page.locator('#launch').click();await page.locator('#search').fill('Polaris');await page.locator('#objects button').click();return page.locator('#detail .live-phone-compass');
}
async function sample(page,{alpha=270,beta=0,gamma=0,absolute=true}={}){
 await page.evaluate(values=>{const event=new Event('deviceorientationabsolute');Object.assign(event,values);window.dispatchEvent(event);},{alpha,beta,gamma,absolute});
}
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
 await page.addInitScript(()=>{for(const name of ['deviceorientation','deviceorientationabsolute'])window.addEventListener(name,e=>{if(e.isTrusted)e.stopImmediatePropagation();},true);});
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
