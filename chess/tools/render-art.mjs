import {createServer} from 'vite';
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const server=await createServer({server:{host:'127.0.0.1',port:5178}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHESS_BROWSER_PATH||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 await mkdir('public/figures',{recursive:true});const page=await browser.newPage({viewport:{width:128,height:128}});await page.goto('http://127.0.0.1:5178/tools/figure-preview.html');await page.waitForFunction(()=>typeof window.renderFigure==='function');
 for(const color of ['w','b'])for(const type of ['k','q','b','n','r','p']){await page.evaluate(({color,type})=>window.renderFigure(color,type),{color,type});await page.screenshot({path:`public/figures/${color}${type}.png`,omitBackground:true});}
 await page.setViewportSize({width:1000,height:600});await page.evaluate(()=>window.renderEnvironment());await page.screenshot({path:'public/showroom-backdrop.jpg',quality:85});
}finally{await browser.close();await server.close();}
