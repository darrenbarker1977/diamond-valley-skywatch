import {test,expect} from '@playwright/test';
test('site-specific app manifest and downloadable PNG icons are valid',async({page,request})=>{
 await page.goto('/');const href=await page.locator('link[rel=manifest]').getAttribute('href');const response=await request.get('/'+href);expect(response.ok()).toBe(true);const manifest=await response.json();
 expect(manifest.name).toBe('Barker After Dark');expect(new URL(manifest.scope,'http://127.0.0.1:8000/manifest.webmanifest').pathname).toBe('/');expect(manifest.start_url).toBe('./');
 for(const icon of manifest.icons){const r=await request.get('/'+icon.src);expect(r.ok()).toBe(true);const bytes=await r.body();expect(bytes.subarray(1,4).toString()).toBe('PNG');const size=Number(icon.sizes.split('x')[0]);expect(bytes.readUInt32BE(16)).toBe(size);expect(bytes.readUInt32BE(20)).toBe(size);}
 await page.getByRole('link',{name:'Home-screen icon & install help'}).click();await expect(page).toHaveTitle('Barker After Dark · Home-screen icon');const link=page.getByRole('link',{name:'Download icon · PNG'});await expect(link).toHaveAttribute('download','Barker-After-Dark-Icon.png');
 const download=page.waitForEvent('download');await link.click();expect((await download).suggestedFilename()).toBe('Barker-After-Dark-Icon.png');
});
