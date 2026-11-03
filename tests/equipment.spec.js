import {test,expect} from '@playwright/test';
test('add eyepieces, update target advice, toggle ownership and preserve kit on reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/prototype/');await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();
 await page.locator('[data-nav-section=equipment]').click();
 await page.locator('#pointing').evaluate(el=>el.open=false);
 await page.locator('#eyepiece-add-panel').evaluate(el=>el.open=true);await page.locator('#new-eyepiece-name').fill('My 32 mm');await page.locator('#new-eyepiece-min').fill('32');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await expect(page.locator('#detail')).toContainText('My 32 mm · about 38×');
 await page.locator('#eyepiece-add-panel').evaluate(el=>el.open=true);await page.locator('#new-eyepiece-name').fill('My 6 mm');await page.locator('#new-eyepiece-min').fill('6');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await page.locator('[data-nav-section=objects]').click();
 await page.locator('#search').fill('Jupiter');await page.locator('#objects button').click();
 // This test is about equipment planning; choose a well-placed Moon if Jupiter is below the current horizon.
 await page.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'));await page.locator('#close').click();await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();
 await page.locator('#search').fill('Moon');await page.locator('#objects button').click();
 await expect(page.locator('#detail')).toContainText('My 6 mm · about 200×');
 await page.locator('[data-nav-section=equipment]').click();
 await page.getByRole('checkbox',{name:'Use My 32 mm',exact:true}).uncheck();await expect(page.locator('#detail')).not.toContainText('My 32 mm');
 await page.getByRole('checkbox',{name:'Use 20 mm 70° wide-angle',exact:true}).uncheck();
 await expect(page.locator('#detail')).toContainText('set to 21 mm');
 await page.reload();await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();await page.locator('[data-nav-section=equipment]').click();
 await expect(page.getByRole('checkbox',{name:'Use My 32 mm',exact:true})).not.toBeChecked();
 await expect(page.getByRole('checkbox',{name:'Use 20 mm 70° wide-angle',exact:true})).not.toBeChecked();
 await page.getByRole('button',{name:'Remove My 32 mm',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Use My 32 mm',exact:true})).toHaveCount(0);
 await page.locator('#eyepiece-add-panel').evaluate(el=>el.open=true);await page.locator('#new-eyepiece-kind').selectOption('zoom');await page.locator('#new-eyepiece-min').fill('8');await page.locator('#new-eyepiece-max').fill('24');await page.getByRole('button',{name:'Add eyepiece',exact:true}).click();
 await expect(page.locator('#kit-list')).toContainText('8–24 mm zoom');
 await page.locator('#telescope-settings').evaluate(el=>el.open=true);await page.locator('#telescope-focal').fill('1000');await expect(page.locator('#kit-list')).toContainText('12.5 mm · about 80×');
 expect(errors).toEqual([]);
});

test('saved assumed kit updates across object advice, finder and tours and stays editable',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T03:00Z'));
 await page.addInitScript(()=>{if(!localStorage.getItem('kit-fixture-loaded')){localStorage.setItem('kit-fixture-loaded','yes');localStorage.setItem('dvsky:navigator:eyepieces:v1',JSON.stringify({focalLength:1200,eyepieces:[{id:'supplied25',name:'Supplied 25 mm',kind:'fixed',min:25,max:25,enabled:true},{id:'supplied10',name:'Supplied 10 mm',kind:'fixed',min:10,max:10,enabled:true},{id:'sv135',name:'SVBONY SV135 7–21 mm zoom',kind:'zoom',min:7,max:21,enabled:true},{id:'my6',name:'My 6 mm',kind:'fixed',min:6,max:6,enabled:false}]}));}});
 await page.goto('/');await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();await page.locator('#search').fill('Albireo');await page.locator('#objects [data-id=Albireo]').click();
 await expect(page.locator('#detail')).toContainText('Find it first with 20 mm 70° wide-angle · about 60×');await expect(page.locator('#detail')).toContainText('SVBONY SV135');await expect(page.locator('#detail')).not.toContainText('Supplied');
 await page.locator('[data-nav-section=equipment]').click();await expect(page.locator('#kit-list')).toContainText('12.5 mm 70° wide-angle');await expect(page.getByRole('checkbox',{name:'Use My 6 mm',exact:true})).not.toBeChecked();await expect(page.locator('#kit-list')).not.toContainText('Supplied');
 await page.getByRole('button',{name:'Remove 12.5 mm 70° wide-angle',exact:true}).click();await page.reload();await page.locator('#launch').click();await page.locator('[data-nav-section=objects]').click();await page.locator('[data-nav-section=equipment]').click();await expect(page.locator('#kit-list')).not.toContainText('12.5 mm');
 await page.locator('[data-nav-section=finder]').click();await page.locator('#fitted-panel>summary').click();await expect(page.locator('#fitted-eyepiece option[value=wide20]')).toHaveText('20 mm 70° wide-angle');await expect(page.locator('#fitted-eyepiece option[value=supplied25]')).toHaveCount(0);
 await page.locator('[data-nav-section=mission]').click();await expect.poll(()=>page.locator('#mission-stops .mission-stop').count()).toBeGreaterThan(0);await expect(page.locator('#mission-stops')).toContainText('Find it first with 20 mm');await expect(page.locator('#mission-stops')).not.toContainText('Supplied');
});
