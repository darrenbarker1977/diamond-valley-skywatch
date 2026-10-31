import {catalogue} from '../prototype/catalogue.js';
import {test,expect} from '@playwright/test';
test('permanent entry loads shared Navigator assets and original forecast',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));
 const time=[];for(let d=26;d<=31;d++)for(let h=0;h<24;h++)time.push(`2026-10-${d}T${String(h).padStart(2,'0')}:00`);
 const hourly={time};for(const n of ['temperature_2m','relative_humidity_2m','dew_point_2m','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','wind_speed_10m','wind_gusts_10m','precipitation_probability','snowfall','visibility','weather_code'])hourly[n]=time.map(()=>n==='visibility'?20000:n==='snowfall'?0:10);
 await page.route('https://api.open-meteo.com/**',route=>route.fulfill({json:{hourly}}));
 await page.goto('/');await expect(page).toHaveTitle('Barker After Dark · Diamond Valley');
 await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();await page.locator('[data-nav-section=equipment]').click();await expect(page.locator('#kit-list')).toContainText('SVBONY');
 await page.locator('[data-nav-section=objects]').click();await expect(page.locator('#objects button')).toHaveCount(catalogue.length);await expect(page.locator('#detail h4')).toHaveText('Recommended eyepiece');
 await page.locator('#nav-to-forecast').click();const f=page.frameLocator('#forecast-frame');await expect(f.locator('#days .day')).toHaveCount(5);await expect(f.locator('#refresh')).toBeEnabled();await f.locator('#refresh').click();await expect(f.locator('#connection')).toContainText('Live');
 expect(errors).toEqual([]);
});
