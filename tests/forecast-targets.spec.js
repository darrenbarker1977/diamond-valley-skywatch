import {test,expect} from '@playwright/test';
import {catalogue} from '../prototype/catalogue.js';
function weather(zone){
 const time=[];for(let d=26;d<=31;d++)for(let h=0;h<24;h++)time.push(`2026-10-${d}T${String(h).padStart(2,'0')}:00`);
 const hourly={time};for(const n of ['temperature_2m','relative_humidity_2m','dew_point_2m','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','visibility','weather_code'])hourly[n]=time.map(()=>n==='visibility'?20000:n==='snowfall'?0:10);
 return {timezone:zone,hourly};
}
test('Friday recommendations change by hemisphere, link into Navigator and follow saved eyepieces',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));
 await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:weather(new URL(r.request().url()).searchParams.get('latitude')==='-23.7'?'Australia/Darwin':'America/Edmonton')}));
 await page.route('https://geocoding-api.open-meteo.com/**',r=>r.fulfill({json:{results:[{name:'Alice Springs',country:'Australia',latitude:-23.7,longitude:133.88,elevation:545,timezone:'Australia/Darwin'}]}}));
 await page.goto('/');await page.locator('#nav-to-forecast').click();const f=page.frameLocator('#forecast-frame');
 await f.locator('#days .day').filter({hasText:'Fri'}).click();await expect(f.locator('#target-summary')).toContainText(String(catalogue.length));await expect(f.locator('#targets .target')).toHaveCount(6);
 const northern=await f.locator('#targets .target').evaluateAll(els=>els.map(el=>el.dataset.id));
 await page.locator('#app-header [data-app-view=home]').click();await page.locator('.dv-location-search').evaluate(el=>el.open=true);await page.locator('#place-query').fill('Alice Springs');await page.getByRole('button',{name:'Search places',exact:true}).click();await page.locator('#place-results button').click();
 await page.locator('#nav-to-forecast').click();await f.locator('#days .day').filter({hasText:'Fri'}).click();
 await expect(f.locator('#target-summary')).toContainText('Australia/Darwin');await expect(f.locator('#targets [data-id=NGC104]')).toContainText('47 Tucanae');await expect(f.locator('#targets [data-id=Saturn]')).toBeVisible();
 const southern=await f.locator('#targets .target').evaluateAll(els=>els.map(el=>el.dataset.id));expect(southern).not.toEqual(northern);expect(southern).not.toContain('Polaris');expect(southern).not.toContain('Sun');
 await expect(f.locator('#targets [data-id=NGC104]')).toContainText('48×');
 await f.locator('#target-summary').scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/skywatch-${info.project.name}-global-targets.png`,fullPage:true});
 await f.locator('#targets [data-id=NGC104] .target-find').click();await expect(page.locator('#target-name')).toHaveText('47 Tucanae');await expect(page.locator('#app-header nav')).toBeVisible();
 await page.locator('[data-nav-section=equipment]').click();await page.locator('#eyepiece-add-panel').evaluate(el=>el.open=true);await page.locator('#new-eyepiece-name').fill('My new 32 mm');await page.locator('#new-eyepiece-min').fill('32');await page.locator('#add-eyepiece-form button[type=submit]').click();
 await page.locator('#nav-to-forecast').click();await expect(f.locator('#targets [data-id=NGC104]')).toContainText('My new 32 mm');await expect(f.locator('#targets [data-id=NGC104]')).toContainText('38×');
 await f.locator('#browse-targets').click();await expect(page.locator('#objects button')).toHaveCount(catalogue.length);await page.locator('#search').fill('M110');await expect(page.locator('#objects button')).toHaveCount(1);
 expect(errors).toEqual([]);
});
test('missing astronomy library leaves Forecast weather and refresh usable',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));await page.route('**/vendor/astronomy.browser.min.js',r=>r.abort());await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:weather('America/Edmonton')}));
 await page.goto('/forecast.html');await expect(page.locator('#days .day')).toHaveCount(5);await expect(page.locator('#targets')).toContainText('astronomy library did not load');await expect(page.locator('#targets .target')).toHaveCount(0);await page.locator('#refresh').click();await expect(page.locator('#connection')).toContainText('Live');
});
