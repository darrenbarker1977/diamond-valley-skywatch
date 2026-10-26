import {test,expect} from '@playwright/test';
test('Navigator title bar has the same working main menu as Home and Forecast',async({page})=>{
 await page.goto('/');await page.locator('#launch').click();const menu=page.locator('#navigator .dv-nav-main-menu');
 await expect(menu.locator('button')).toHaveText(['Home','Forecast','Navigator']);await expect(menu.locator('[data-open-section=objects]')).toHaveAttribute('aria-current','page');
 await page.locator('[data-nav-section=equipment]').click();await menu.locator('[data-open-section=objects]').click();await expect(page.locator('.dv-nav-content')).toBeVisible();
 await menu.locator('[data-app-view=home]').click();await expect(page.locator('#navigator')).not.toBeVisible();await expect(page.locator('#home-view')).toBeVisible();
 await page.locator('#launch').click();await menu.locator('[data-app-view=forecast]').click();await expect(page.locator('#forecast-view')).toBeVisible();await expect(page.locator('#navigator')).not.toBeVisible();
 await page.locator('.dv-app-header [data-open-section=objects]').click();await expect(menu).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
