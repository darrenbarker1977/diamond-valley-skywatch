import {test,expect} from '@playwright/test';
test('add eyepieces, update target advice, toggle ownership and preserve kit on reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/prototype/');await page.locator('#launch').click();
 await page.locator('[data-nav-section=equipment]').click();
 await page.locator('#pointing').evaluate(el=>el.open=false);
 await page.locator('#new-eyepiece-name').fill('My 32 mm');await page.locator('#new-eyepiece-min').fill('32');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await expect(page.locator('#detail')).toContainText('My 32 mm · about 38×');
 await page.locator('#new-eyepiece-name').fill('My 6 mm');await page.locator('#new-eyepiece-min').fill('6');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await page.locator('[data-nav-section=objects]').click();
 await page.locator('#search').fill('Jupiter');await page.locator('#objects button').click();
 // This test is about equipment planning; choose a well-placed Moon if Jupiter is below the current horizon.
 await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));await page.locator('#close').click();await page.locator('#launch').click();
 await page.locator('#search').fill('Moon');await page.locator('#objects button').click();
 await expect(page.locator('#detail')).toContainText('My 6 mm · about 200×');
 await page.locator('[data-nav-section=equipment]').click();
 await page.getByRole('checkbox',{name:'Use My 32 mm',exact:true}).uncheck();await expect(page.locator('#detail')).not.toContainText('My 32 mm');
 await page.getByRole('checkbox',{name:'Use Supplied 25 mm',exact:true}).uncheck();
 await expect(page.locator('#detail')).toContainText('set to 21 mm');
 await page.reload();await page.locator('#launch').click();await page.locator('[data-nav-section=equipment]').click();
 await expect(page.getByRole('checkbox',{name:'Use My 32 mm',exact:true})).not.toBeChecked();
 await expect(page.getByRole('checkbox',{name:'Use Supplied 25 mm',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:'Remove My 32 mm',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Use My 32 mm',exact:true})).toHaveCount(0);
 await page.locator('#new-eyepiece-kind').selectOption('zoom');await page.locator('#new-eyepiece-min').fill('8');await page.locator('#new-eyepiece-max').fill('24');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await expect(page.locator('#kit-list')).toContainText('8–24 mm zoom');
 await page.locator('#telescope-focal').fill('1000');await expect(page.locator('#kit-list')).toContainText('10 mm · about 100×');
 expect(errors).toEqual([]);
});
