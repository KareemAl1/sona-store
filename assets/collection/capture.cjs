const fs=require('node:fs');const path=require('node:path');const {launchBrowser}=require('./browser.cjs');
(async()=>{
 const [product='dot',finish='pearl',mode='path',sampleArg='256',detailArg='']=process.argv.slice(2),detail=detailArg==='detail',samples=Number(sampleArg),width=detail?1400:1100,height=detail?1000:1100;
 if(!['dot','room'].includes(product)||!['pearl','graphite','fig'].includes(finish)||!['path','raster'].includes(mode)||!Number.isInteger(samples)||samples<1||samples>4096||detailArg&&!detail)throw Error('Usage: capture.cjs <dot|room> <pearl|graphite|fig> <path|raster> <samples> [detail]');
 const browser=await launchBrowser();try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>console.error(e));
  await page.goto(`http://127.0.0.1:4180/?${new URLSearchParams({product,finish,mode,width,height,samples,...(detail?{detail:'1'}:{})})}`);
  for(let i=0;i<360;i++){await page.waitForTimeout(5000);const status=await page.evaluate(()=>window.statusInfo);if(i%4===0||status?.stage==='complete')console.log(JSON.stringify(status));if(status?.stage!=='complete')continue;
   const name=`${product}-${finish}-${detail?'macro':'square'}${mode==='raster'?'-raster':''}.png`;fs.writeFileSync(path.join(__dirname,name),Buffer.from((await page.evaluate(()=>window.capture())).split(',')[1],'base64'));
   if(mode==='path')fs.writeFileSync(path.join(__dirname,name.replace('.png','.capture.json')),JSON.stringify({product,finish,mode,width,height,requestedSamples:samples,completedSamples:status.samples,capturedAt:new Date().toISOString(),browserVersion:browser.version()},null,2));
   console.log('SAVED '+name);return;
  }throw Error('Render timeout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
