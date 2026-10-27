import {test,expect} from '@playwright/test';
test('real sky atlas pans, zooms, centres, changes views and stays in red night mode',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));
 await page.addInitScript(()=>{window.sensorSubscriptions=[];const old=window.addEventListener;window.addEventListener=function(name,...args){if(['deviceorientation','deviceorientationabsolute'].includes(name))window.sensorSubscriptions.push(name);return old.call(this,name,...args);};});
 await page.goto('/');await page.locator('#launch').click();const sky=page.locator('#sky-canvas');await expect(sky).toHaveAttribute('data-ready','true');await expect(sky).toHaveAttribute('data-star-count','2851');
 await page.locator('[data-atlas-bearing="0"]').click();await expect(sky).toHaveAttribute('data-azimuth','0');await sky.focus();await page.keyboard.press('ArrowRight');await expect(sky).not.toHaveAttribute('data-azimuth','0');
 const field=await page.locator('#atlas-zoom').textContent();await page.locator('#atlas-in').click();await expect(page.locator('#atlas-zoom')).not.toHaveText(field);
 await page.locator('.atlas-options').evaluate(el=>el.open=true);await page.locator('#atlas-overview').click();await expect(sky).toHaveAttribute('data-view','dome');await page.locator('#atlas-lines').click();await expect(page.locator('#atlas-lines')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#atlas-follow')).toBeDisabled();await page.locator('#atlas-overview').click();await expect(sky).toHaveAttribute('data-view','horizon');await page.locator('.atlas-options').evaluate(el=>el.open=false);
 await page.locator('#search').fill('Saturn');await page.locator('#objects button').click();await expect(page.locator('#object-library')).not.toHaveAttribute('open');await expect(page.locator('#target-name')).toHaveText('Saturn');
 await expect.poll(()=>page.locator('#detail img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.locator('#atlas-center').click();await expect(sky).toHaveAttribute('data-view','horizon');
 await page.locator('#atlas-lines').evaluate(el=>{if(el.getAttribute('aria-pressed')==='false')el.click();});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/skywatch-${info.project.name}-new-atlas.png`,fullPage:true});
 await page.locator('#find-selected').click();await expect(page.locator('#finder-name')).toHaveText('Saturn');await expect(page.locator('#finder-locked')).toBeVisible();await expect(page.locator('#finder-arrows')).toBeHidden();await expect(page.locator('#finder-horizontal')).toHaveText('');await expect(page.locator('#finder-eyepiece')).toContainText('mm');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/skywatch-${info.project.name}-new-finder.png`,fullPage:true});
 await page.locator('#finder-setup').click();await expect(page.locator('#pointing')).toBeVisible();await expect(page.locator('#sensor-status')).toHaveText('Sensors off');
 await page.locator('[data-nav-section=objects]').click();await page.locator('#night').click();await expect.poll(()=>sky.evaluate(canvas=>{const p=canvas.getContext('2d').getImageData(4,4,1,1).data;return p[0]>p[1]&&p[0]>p[2];})).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await page.evaluate(()=>window.sensorSubscriptions)).every(name=>['deviceorientationabsolute','deviceorientation'].includes(name))).toBe(true);expect(errors).toEqual([]);
});
test('optional panels collapse independently and preserve their state through updates',async({page})=>{
 await page.clock.install({time:new Date('2026-10-27T03:00Z')});await page.goto('/');await expect(page.locator('.home-preparation')).not.toHaveAttribute('open');
 await page.locator('#launch').click();await expect(page.locator('#object-library')).not.toHaveAttribute('open');await page.locator('#detail .object-expect').evaluate(el=>el.open=true);await page.clock.fastForward(11000);await expect(page.locator('#detail .object-expect')).toHaveAttribute('open');
 await page.locator('#selected-panel').evaluate(el=>el.open=false);await page.clock.fastForward(11000);await expect(page.locator('#selected-panel')).not.toHaveAttribute('open');await expect(page.locator('#sky-canvas')).toBeVisible();
});
test('atlas and cached NASA cards remain available after an offline reload',async({page,context})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));await page.goto('/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.reload();await page.locator('#launch').click();await expect(page.locator('#sky-canvas')).toHaveAttribute('data-ready','true');
 await page.locator('#search').fill('Saturn');await page.locator('#objects button').click();await expect.poll(()=>page.locator('#detail img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await context.setOffline(false);
});
test('Forecast weather and reference sections fold without losing refresh state',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));
 const time=[];for(let d=26;d<=31;d++)for(let h=0;h<24;h++)time.push(`2026-10-${d}T${String(h).padStart(2,'0')}:00`);
 const hourly={time};for(const key of ['temperature_2m','relative_humidity_2m','dew_point_2m','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','visibility','weather_code'])hourly[key]=time.map(()=>key==='snowfall'?0:key==='visibility'?20000:10);
 await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:{timezone:'America/Edmonton',hourly}}));await page.goto('/forecast.html');await expect(page.locator('#days .day')).toHaveCount(5);
 await expect(page.locator('#weather-details')).not.toHaveAttribute('open');await expect(page.locator('#event-panel')).not.toHaveAttribute('open');await expect(page.locator('.forecast-guide')).not.toHaveAttribute('open');
 await page.locator('#weather-details>summary').click();await expect(page.locator('#tiles')).toBeVisible();await page.locator('#refresh').click();await expect(page.locator('#connection')).toContainText('Live');await expect(page.locator('#weather-details')).toHaveAttribute('open');
 await page.locator('#target-panel>summary').click();await expect(page.locator('#targets')).toBeHidden();await page.locator('#target-panel>summary').click();await expect(page.locator('#targets')).toBeVisible();
});
test.describe('optional visual failures',()=>{
 test.use({serviceWorkers:'block'});
 test('missing dense star data leaves catalogue and navigation usable',async({page})=>{
  await page.route('**/atlas-data.js*',r=>r.abort());await page.goto('/');await page.locator('#launch').click();await expect(page.locator('#atlas-status')).toContainText('Map unavailable');
  await page.locator('#search').fill('M31');await page.locator('#objects button').click();await expect(page.locator('#target-name')).toHaveText('Andromeda Galaxy');await expect(page.locator('#atlas-follow')).toBeDisabled();await page.locator('#nav-to-forecast').click();await expect(page.locator('#forecast-view')).toBeVisible();
 });
 test('missing photo uses a labelled illustration',async({page})=>{
  await page.route('**/assets/objects/saturn.jpg',r=>r.abort());await page.goto('/');await page.locator('#discovery-mode').uncheck();await page.locator('#launch').click();await page.locator('#search').fill('Saturn');await page.locator('#objects button').click();await expect(page.locator('#detail figcaption')).toContainText('Photo unavailable');await expect(page.locator('#detail .object-illustration')).toBeVisible();
 });
});
