import {test,expect} from '@playwright/test';
const clickSquare=(page,s)=>page.locator(`[data-square="${s}"]`).click();
test('desktop: rendering, legal selection, saved game, undo and sound',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#status')).toHaveText('Crimson has the floor.');
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});await page.locator('#camera').click();await expect(page.locator('#camera')).toHaveText('Play view');await page.screenshot({path:'test-results/showroom.png',fullPage:true});await page.locator('#camera').click();
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
 const canvas=page.locator('canvas');await canvas.scrollIntoViewIfNeeded();const rect=await canvas.boundingBox();
 const project=(file,rank,y)=>{const aspect=rect.width/rect.height,z=4.5-rank,x=file-3.5,len=Math.hypot(18,14),sy=18/len,sz=14/len,span=Math.max(10.8,11.8/aspect),scale=2*1.22/span;return{x:rect.x+rect.width*(1+x*scale/aspect)/2,y:rect.y+rect.height*(1-(sz*y-sy*z)*scale)/2}};
 await page.mouse.click(...Object.values(project(6,1,.65)));await expect(page.locator('#hint')).toContainText('Service Tools');
 await page.mouse.click(...Object.values(project(5,3,.16)));await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');
 await expect(page.locator('#undo')).toBeEnabled();await page.locator('#flip').click();await expect(page.locator('#log')).toContainText('Nf3');await page.waitForTimeout(500);expect(errors).toEqual([]);
});

test('3D view reliably returns after the 2D board is shown',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const canvas=page.locator('#board3d canvas');await expect(canvas).toBeVisible();
 await page.locator('#view').click();await expect(page.locator('#board2d')).toBeVisible();await expect(page.locator('#view')).toHaveText('3D board');
 await page.locator('#view').click();await expect(canvas).toBeVisible();await expect(page.locator('#board2d')).toBeHidden();await expect(page.locator('#view-label')).toHaveText('3D SHOWROOM');
 await page.waitForTimeout(150);const size=await canvas.evaluate(c=>({w:c.width,h:c.height}));expect(size.w).toBeGreaterThan(300);expect(size.h).toBeGreaterThan(300);await page.screenshot({path:'test-results/mobile-3d-restored.png',fullPage:true});
});

test('2D fallback keeps dealership figures and remains playable',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args)}});
 await page.goto('/');await expect(page.locator('#board2d')).toBeVisible();await expect(page.locator('[data-square="e1"] img')).toHaveAttribute('src','/figures/wk.png');
 await page.waitForFunction(()=>[...document.querySelectorAll('#board2d img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:'test-results/fallback.png',fullPage:true});await clickSquare(page,'e2');await clickSquare(page,'e4');await expect(page.locator('#status')).toHaveText('Cobalt has the floor.');
});

test('capture effects finish, skip, and respect disabled animation for en passant',async({page})=>{
 test.setTimeout(60000);await page.goto('/');
 await page.locator('#combat').uncheck();await page.reload();await expect(page.locator('#combat')).not.toBeChecked();await page.locator('#combat').check();
 const result=await page.evaluate(async()=>{
  const {Board}=await import('/src/board.js');const {Game}=await import('/src/game.js');
  const host=document.createElement('div');host.style.cssText='width:600px;height:500px';document.body.append(host);const board=new Board(host,()=>{});const game=new Game();
  game.chess.load('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1');board.sync(game.chess);const count=board.scene.children.length;const move=game.move('e4','d5');await board.animate(move);const finished=board.animations.length===0&&board.scene.children.length===count&&board.camera.zoom===1.22;
  board.sync(game.chess);
  game.chess.load('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1');board.sync(game.chess);const pending=board.animate(game.move('e4','d5'));board.skipAnimations();await pending;const skipped=board.animations.length===0&&board.camera.zoom===1.22;
  game.chess.load('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');board.sync(game.chess);board.combatEnabled=false;const ep=game.move('e5','d6');await board.animate(ep);board.sync(game.chess);const enPassant=ep.flags.includes('e')&&!board.pieces.has('d5')&&board.pieces.has('d6')&&board.animations.length===0;
  board.reduced=true;board.combatEnabled=true;game.chess.load('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1');board.sync(game.chess);await board.animate(game.move('e4','d5'));const reduced=board.animations.length===0;
  board.renderer.setAnimationLoop(null);board.resizeObserver.disconnect();board.renderer.dispose();host.remove();return {finished,skipped,enPassant,reduced};
 });expect(result).toEqual({finished:true,skipped:true,enPassant:true,reduced:true});
});
