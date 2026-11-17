import {test,expect} from './fixtures.js';
import {modelWeather,officialFeature} from './official-fixture.mjs';
test.use({serviceWorkers:'block'});
async function setup(page,{cloud=10,fail=false}={}){
 await page.clock.setFixedTime(new Date('2026-11-09T16:00Z'));
 await page.route('https://api.open-meteo.com/**',r=>fail?r.abort():r.fulfill({json:modelWeather(new URL(r.request().url()).searchParams.get('latitude').startsWith('-')?'Australia/Darwin':'Etc/GMT+6',cloud)}));
 await page.goto('/');
}
test('opening brief is above the sky, uses Forecast verdict and opens tonight rather than a selected later night',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await setup(page);
 const bar=page.locator('#home-tonight');await expect(bar).toHaveAttribute('data-state','green');await expect(bar).toHaveAttribute('data-date','2026-11-09');await expect(page.locator('#home-tonight-conditions')).toHaveText('Cloud 10% · 10°C · Wind up to 10 km/h');
 expect(await bar.evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('#home-atlas-title').getBoundingClientRect().top)).toBe(true);
 await page.locator('#home-tonight-open').click();const f=page.frameLocator('#forecast-frame');await expect(f.locator('#verdict')).toContainText('YES');await f.locator('#days .day').nth(2).click();await expect(f.locator('#detailtitle')).toContainText('November 11');await page.locator('#app-header [data-app-view=home]').click();await expect(bar).toHaveAttribute('data-date','2026-11-09');await page.locator('#home-tonight-open').click();await expect(f.locator('#detailtitle')).toContainText('November 9');await page.locator('#app-header [data-app-view=home]').click();await page.screenshot({path:`/tmp/live-home-tonight-${info.project.name}.png`,fullPage:true});expect(errors).toEqual([]);
});
test('refresh and a different global place update the opening brief, ignoring old-location messages',async({page})=>{
 await setup(page);await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','green');
 await page.route('https://geocoding-api.open-meteo.com/**',r=>r.fulfill({json:{results:[{name:'Alice Springs',latitude:-23.7,longitude:133.88,country:'Australia',timezone:'Australia/Darwin'}]}}));
 await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:modelWeather('Australia/Darwin',95)}));
 await page.locator('#home-choose-place').click();await page.locator('#place-query').fill('Alice Springs');await page.getByRole('button',{name:'Search places',exact:true}).click();await page.locator('#place-results button').click();await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','skip');await expect(page.locator('#home-tonight')).toHaveAttribute('data-date','2026-11-10');await expect(page.locator('#home-tonight-window')).toContainText('Alice Springs');await expect(page.locator('#home-tonight-conditions')).toContainText('95%');
 const frame=page.frames().find(f=>f.url().includes('forecast.html'));await frame.evaluate(()=>parent.postMessage({type:'dvsky-weather-snapshot',latitude:50.68,longitude:-114.25,tonight:{verdict:'GREEN LIGHT'}},location.origin));await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','skip');
 await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:modelWeather('Australia/Darwin',10)}));await page.locator('#home-tonight-open').click();await page.frameLocator('#forecast-frame').locator('#refresh').click();await page.locator('#app-header [data-app-view=home]').click();await expect(page.locator('#home-tonight-conditions')).toContainText('10%');await expect(page.locator('#home-tonight')).not.toHaveAttribute('data-state','skip');
});
test('failed weather never invents a verdict, and saved weather is visibly labelled after failed reload',async({page})=>{
 await setup(page,{fail:true});await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','unavailable');await expect(page.locator('#home-tonight-verdict')).toContainText('unavailable');await expect(page.locator('#home-tonight-source')).toHaveText('');
 await page.route('https://api.open-meteo.com/**',r=>r.fulfill({json:modelWeather('Etc/GMT+6',10)}));await page.locator('#home-tonight-open').click();await page.frameLocator('#forecast-frame').locator('#refresh').click();await expect(page.frameLocator('#forecast-frame').locator('#connection')).toContainText('Live');await page.locator('#app-header [data-app-view=home]').click();await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','green');
 await page.route('https://api.open-meteo.com/**',r=>r.abort());await page.reload();await expect(page.locator('#home-tonight')).toHaveAttribute('data-state','saved');await expect(page.locator('#home-tonight-source')).toContainText('Saved forecast; may be stale');await expect(page.locator('#home-tonight-conditions')).toContainText('10%');
});

test('official-only weather keeps its source without invented model percentages or temperature',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-11-09T16:00Z'));await page.route('https://api.open-meteo.com/**',r=>r.abort());await page.route('https://api.weather.gc.ca/**',r=>r.fulfill({json:{features:[officialFeature()],numberMatched:1}}));await page.goto('/');await expect(page.locator('#home-tonight-source')).toContainText('Environment Canada');await expect(page.locator('#home-tonight-source')).not.toContainText('Open-Meteo hourly');await expect(page.locator('#home-tonight-conditions')).not.toContainText('%');await expect(page.locator('#home-tonight-conditions')).not.toContainText('°C');await expect(page.locator('#home-tonight')).not.toHaveAttribute('data-state','green');
});
