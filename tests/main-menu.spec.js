import {test,expect} from '@playwright/test';
test('Home, Forecast and Navigator use the same header node, artwork and buttons',async({page},info)=>{
 await page.goto('/');const menu=page.locator('#app-header nav');
 await expect(menu.locator('button')).toHaveText(['Home','Forecast','Navigator']);
 await page.locator('#app-header').evaluate(el=>el.dataset.identity='same-actual-header');
 const baseline=await page.locator('#app-header').boundingBox();
 await menu.locator('[data-open-section=objects]').click();await expect(page.locator('#navigator')).toBeVisible();
 await expect(page.locator('#app-header')).toHaveAttribute('data-identity','same-actual-header');await expect(menu).toBeVisible();await expect(menu.locator('[data-open-section=objects]')).toHaveAttribute('aria-current','page');
 const navigatorBox=await page.locator('#app-header').boundingBox();expect(navigatorBox.width).toBe(baseline.width);expect(navigatorBox.height).toBe(baseline.height);
 await expect(page.locator('#navigator .dv-nav-main-menu')).toHaveCount(0);await expect(page.locator('#navigator .dv-nav-brand-art')).toHaveCount(0);
 await page.locator('[data-nav-section=equipment]').click();await menu.locator('[data-open-section=objects]').click();await expect(page.locator('#walkthrough-view')).toBeVisible();
 await page.screenshot({path:`/tmp/skywatch-${info.project.name}-shared-header.png`,fullPage:true});
 await menu.locator('[data-app-view=home]').click();await expect(page.locator('#navigator')).not.toBeVisible();await expect(page.locator('#home-view')).toBeVisible();
 await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();await menu.locator('[data-app-view=forecast]').click();await expect(page.locator('#forecast-view')).toBeVisible();await expect(page.locator('#navigator')).not.toBeVisible();await expect(page.locator('#app-header')).toHaveAttribute('data-identity','same-actual-header');
 await menu.locator('[data-open-section=objects]').click();await page.keyboard.press('Escape');await expect(page.locator('#forecast-view')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
