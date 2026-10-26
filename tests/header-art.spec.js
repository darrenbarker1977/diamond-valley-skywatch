import {test,expect} from '@playwright/test';
test('header art loads on Home, Forecast and every Navigator tool',async({page},info)=>{
 await page.route('https://api.open-meteo.com/**',r=>r.abort());await page.goto('/');const main=page.locator('#app-header .dv-brand-art');
 await expect(main).toBeVisible();await expect.poll(()=>main.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 const brand=await page.locator('.dv-app-brand').boundingBox(),art=await main.boundingBox();expect(art.x).toBeGreaterThanOrEqual(brand.x+brand.width);
 await page.screenshot({path:`/tmp/skywatch-${info.project.name}-art-home.png`,fullPage:true});
 await page.locator('.dv-app-header [data-app-view=forecast]').click();await expect(main).toBeVisible();const launch=await page.locator('#launch').boundingBox();expect(launch.x+launch.width<=art.x||launch.x>=art.x+art.width||launch.y+launch.height<=art.y||launch.y>=art.y+art.height).toBe(true);
 await page.locator('#launch').click();const panel=page.locator('#navigator .dv-nav-brand-art');await expect(panel).toBeVisible();await expect.poll(()=>panel.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 for(const section of ['objects','pointing','equipment']){await page.locator(`[data-nav-section=${section}]`).click();await expect(panel).toBeVisible();}
 await page.locator('#night').click();expect(await panel.evaluate(img=>getComputedStyle(img).filter)).toContain('brightness');
 await page.screenshot({path:`/tmp/skywatch-${info.project.name}-art-night.png`,fullPage:true});await page.locator('#close').click();await expect(page.locator('#navigator')).not.toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
