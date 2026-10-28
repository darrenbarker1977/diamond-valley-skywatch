import {test,expect} from '@playwright/test';
test('site-specific app manifest and downloadable PNG icons are valid',async({page,request})=>{
 await page.goto('/');const href=await page.locator('link[rel=manifest]').getAttribute('href');const response=await request.get('/'+href);expect(response.ok()).toBe(true);const manifest=await response.json();
 expect(manifest.name).toBe('Barker After Dark');expect(new URL(manifest.scope,'http://127.0.0.1:8000/manifest.webmanifest').pathname).toBe('/');expect(manifest.start_url).toBe('./');
 for(const icon of manifest.icons){const r=await request.get('/'+icon.src);expect(r.ok()).toBe(true);const bytes=await r.body();expect(bytes.subarray(1,4).toString()).toBe('PNG');const size=Number(icon.sizes.split('x')[0]);expect(bytes.readUInt32BE(16)).toBe(size);expect(bytes.readUInt32BE(20)).toBe(size);}
 await page.locator('#home-preferences>summary').click();await page.getByRole('link',{name:'Home-screen icon & install help'}).click();await expect(page).toHaveTitle('Barker After Dark · Home-screen icon');const link=page.getByRole('link',{name:'Download icon · PNG'});await expect(link).toHaveAttribute('download','Barker-After-Dark-Icon.png');
 const download=page.waitForEvent('download');await link.click();expect((await download).suggestedFilename()).toBe('Barker-After-Dark-Icon.png');
});
test('circular widget PNG has transparent corners and a real downloadable file',async({page})=>{
 await page.goto('/download-icon.html');const img=page.locator('img.icon');await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth===512)).toBe(true);
 const alpha=await img.evaluate(e=>{const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.drawImage(e,0,0);return [ctx.getImageData(0,0,1,1).data[3],ctx.getImageData(256,256,1,1).data[3]];});expect(alpha[0]).toBe(0);expect(alpha[1]).toBeGreaterThan(250);
 const download=page.waitForEvent('download');await page.getByRole('link',{name:'Download circular image · PNG'}).click();expect((await download).suggestedFilename()).toBe('Barker-After-Dark-Circular.png');
 await expect(page.getByText('Make it large like the Duolingo widget')).toBeVisible();
});
