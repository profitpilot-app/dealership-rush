import {test,expect} from '@playwright/test';
const clickSquare=(page,s)=>page.locator(`[data-square="${s}"]`).click();
test('desktop: rendering, legal selection, saved game, undo and sound',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#status')).toHaveText('Crimson has the floor.');
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 await page.locator('#view').click();await clickSquare(page,'e2');await expect(page.locator('[data-square="e4"]')).toHaveClass(/legal/);await clickSquare(page,'e4');await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');
 await page.reload();await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');await expect(page.locator('#log')).toContainText('e4');
 await page.locator('#undo').click();await expect(page.locator('#status')).toHaveText('Crimson has the floor.');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
});
test('computer responds, reset is confirmed, mobile fits',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#house').click();await page.locator('#view').click();await clickSquare(page,'e2');await clickSquare(page,'e4');await expect(page.locator('#move-count')).toHaveText('2 PLIES');await expect(page.locator('#status')).toHaveText('Crimson has the floor.');
 await page.locator('#undo').click();await expect(page.locator('#move-count')).toHaveText('0 PLIES');
 await page.locator('#new').click();await expect(page.locator('#new-dialog')).toBeVisible();await page.locator('#cancel-new').click();
 await page.locator('#view').click();await page.screenshot({path:'test-results/mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('3D picking, animation and rotation produce no runtime errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 // Project known board squares through the same initial camera geometry.
 const canvas=page.locator('canvas');const rect=await canvas.boundingBox();
 const project=(file,rank,y)=>{const aspect=rect.width/rect.height, z=4.5-rank,x=file-3.5,cy=aspect<1?13:11,cz=aspect<1?19:16,len=Math.hypot(cy,cz),sy=cy/len,sz=cz/len;const depth=len-sy*y-sz*z,yy=sz*y-sy*z,scale=(aspect<1?.95:1.2)/Math.tan(18*Math.PI/180);return{x:rect.x+rect.width*(1+x*scale/(depth*aspect))/2,y:rect.y+rect.height*(1-yy*scale/depth)/2}};
 await page.mouse.click(...Object.values(project(6,1,.65)));await expect(page.locator('#hint')).toContainText('Service Technician');
 await page.mouse.click(...Object.values(project(5,3,.16)));await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');
 await expect(page.locator('#undo')).toBeEnabled();await page.locator('#flip').click();await expect(page.locator('#log')).toContainText('Nf3');await page.waitForTimeout(500);expect(errors).toEqual([]);
});

test('2D fallback keeps dealership figures and remains playable',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args)}});
 await page.goto('/');await expect(page.locator('#board2d')).toBeVisible();await expect(page.locator('[data-square="e1"] img')).toHaveAttribute('src','/figures/wk.png');
 await page.waitForFunction(()=>[...document.querySelectorAll('#board2d img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'test-results/fallback.png',fullPage:true});await clickSquare(page,'e2');await clickSquare(page,'e4');await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');
});
