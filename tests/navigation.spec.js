import {test,expect} from '@playwright/test';
test('home tools and preserved forecast refresh',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let requests=0;
 await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));
 const time=[];for(let day=26;day<=31;day++)for(let h=0;h<24;h++)time.push(`2026-10-${day}T${String(h).padStart(2,'0')}:00`);
 const hourly={time};for(const name of ['temperature_2m','relative_humidity_2m','dew_point_2m','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','visibility','weather_code'])hourly[name]=time.map(()=>name==='visibility'?20000:name==='snowfall'?0:10);
 await page.route('https://api.open-meteo.com/**',route=>{requests++;return route.fulfill({json:{hourly}});});
 await page.goto('/prototype/');await expect(page.locator('#home-view')).toBeVisible();expect(requests).toBe(0);
 await page.locator('[data-open-section=equipment]').click();await expect(page.locator('#equipment')).toBeVisible();await expect(page.locator('.dv-nav-content')).toBeHidden();
 await page.locator('[data-nav-section=objects]').click();await expect(page.locator('#detail h4')).toHaveText('Recommended eyepiece');
 await page.locator('#nav-to-forecast').click();const weather=page.frameLocator('#forecast-frame');
 await expect(weather.locator('#days .day')).toHaveCount(5);await expect(weather.locator('#refresh')).toBeEnabled();
 await weather.locator('#days .day').nth(2).click();const title=await weather.locator('#detailtitle').textContent();
 await weather.locator('#refresh').click();await expect.poll(()=>requests).toBe(2);await expect(weather.locator('#detailtitle')).toHaveText(title);
 await page.locator('.dv-app-header [data-app-view=home]').click();await page.locator('.dv-app-header [data-app-view=forecast]').click();await expect(weather.locator('#detailtitle')).toHaveText(title);expect(requests).toBe(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
