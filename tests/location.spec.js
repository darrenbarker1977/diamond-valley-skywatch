import {test,expect} from '@playwright/test';
function weather(zone){const time=[];for(let d=26;d<=31;d++)for(let h=0;h<24;h++)time.push(`2026-10-${d}T${String(h).padStart(2,'0')}:00`);const hourly={time};for(const n of ['temperature_2m','relative_humidity_2m','dew_point_2m','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','visibility','weather_code'])hourly[n]=time.map(()=>n==='visibility'?20000:n==='snowfall'?0:10);return {timezone:zone,hourly};}
test('remote global search updates title, weather coordinates/timezone and survives offline reload',async({page,context})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));
 await page.route('https://geocoding-api.open-meteo.com/**',r=>r.fulfill({json:{results:[{name:'Alice Springs',admin1:'Northern Territory',country:'Australia',latitude:-23.7,longitude:133.88,elevation:545,timezone:'Australia/Darwin'}]}}));
 const requests=[];await page.route('https://api.open-meteo.com/**',r=>{requests.push(r.request().url());return r.fulfill({json:weather('Australia/Darwin')});});
 await page.goto('/');await page.locator('.dv-location-search').evaluate(el=>el.open=true);await page.locator('#place-query').fill('Alice Springs, Australia');await page.getByRole('button',{name:'Search places',exact:true}).click();await page.locator('#place-results button').click();
 await expect(page.locator('.dv-app-brand')).toContainText('Alice Springs');await expect(page.locator('#location-display')).toContainText('23.70000° S');
 await page.locator('[data-open-section=pointing]').click();await page.locator('#enable-sensors').click();await expect(page.locator('#alignment-feedback')).toContainText('Remote viewing only');await expect(page.locator('#sensor-status')).toHaveText('Sensors off');await page.locator('#close').click();
 await page.locator('.dv-app-header [data-app-view=forecast]').click();const f=page.frameLocator('#forecast-frame');await expect(f.locator('#days .day')).toHaveCount(5);await expect(f.locator('.hero-copy .kicker')).toContainText('Alice Springs');
 expect(new URL(requests.at(-1)).searchParams.get('latitude')).toBe('-23.7');expect(new URL(requests.at(-1)).searchParams.get('timezone')).toBe('auto');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.unroute('https://api.open-meteo.com/**');await context.setOffline(true);await page.reload();
 await expect(page.locator('.dv-app-brand')).toContainText('Alice Springs');await expect(page.locator('#location-status')).toContainText('Restored your last');
 await page.locator('.dv-app-header [data-app-view=forecast]').click();await expect(f.locator('#days .day')).toHaveCount(5);await expect(f.locator('#connection')).toContainText('Offline');
 await context.setOffline(false);
});
test('manual coordinates, failed precision request and reset retain honest locations',async({page})=>{
 await page.addInitScript(()=>{window.__geoCalls=0;navigator.geolocation.getCurrentPosition=(ok,fail,options)=>{window.__geoCalls++;window.__geoOptions=options;fail({code:1});};});
 await page.goto('/');expect(await page.evaluate(()=>window.__geoCalls)).toBe(0);
 await page.locator('.dv-location-search').evaluate(el=>el.open=true);await page.locator('#coordinate-form').evaluate(el=>el.closest('details').open=true);
 await page.locator('#coordinate-name').fill('Outback site');await page.locator('#site-latitude').fill('-25.5');await page.locator('#site-longitude').fill('134.2');await page.getByRole('button',{name:'Use these coordinates'}).click();
 await expect(page.locator('.dv-app-brand')).toContainText('Outback site');await page.locator('#use-location').click();await expect(page.locator('#location-status')).toContainText('denied');await expect(page.locator('#location-display')).toContainText('Outback site');
 expect(await page.evaluate(()=>window.__geoOptions.enableHighAccuracy)).toBe(true);await page.reload();await expect(page.locator('#location-display')).toContainText('Outback site');
 await page.locator('#reset-location').click();await expect(page.locator('#location-display')).toContainText('Diamond Valley');
});
test('successful precise fix updates all observing calculations without making tracking claims',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:51.5,longitude:-0.12,accuracy:17});await page.goto('/');await page.locator('#use-location').click();
 await expect(page.locator('#location-display')).toContainText('51.50000° N');await expect(page.locator('#location-display')).toContainText('±17 m');await expect(page.locator('#location-status')).toContainText('not live tracking');
 await page.locator('.dv-app-header [data-open-section=objects]').click();await expect(page.locator('#observer-name')).toHaveText('MY LOCATION');
});
