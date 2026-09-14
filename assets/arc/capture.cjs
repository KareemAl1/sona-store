const {chromium}=require('playwright');
const fs=require('fs');const path=require('path');
(async()=>{
 const args=process.argv.slice(2);const finish=args[0]||'pearl';const mode=args[1]||'path';const width=+(args[2]||1100);const height=+(args[3]||1500);const samples=+(args[4]||128);const detail=args.includes('detail');
 const browser=await chromium.launch({headless:true,executablePath:process.env.SONA_BROWSER_PATH || (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined),args:['--disable-gpu-sandbox','--enable-unsafe-swiftshader','--no-sandbox','--use-angle=d3d11']});
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('console',m=>console.log(m.type(),m.text()));page.on('pageerror',e=>console.error(e));
 await page.goto(`http://127.0.0.1:4179/?finish=${finish}&mode=${mode}&width=${width}&height=${height}&samples=${samples}${detail?'&detail=1':''}`);
 for(let i=0;i<240;i++){
  await page.waitForTimeout(5000);const status=await page.evaluate(()=>window.statusInfo);console.log(JSON.stringify(status));
  if(status?.stage==='complete'){
   const square=width===height&&!detail;
   const data=await page.evaluate(()=>window.capture());const name=square?`sona-${finish}-square.png`:`sona-${finish}${detail?'-detail':''}-${mode}.png`;
   fs.writeFileSync(path.join(__dirname,name),Buffer.from(data.split(',')[1],'base64'));console.log('SAVED '+name);
   if(finish==='pearl'&&!detail&&!square){const glb=await page.evaluate(()=>window.exportGeometry?.());if(glb){fs.writeFileSync(path.join(__dirname,'sona-arc-original.glb'),Buffer.from(glb.split(',')[1],'base64'));console.log('SAVED sona-arc-original.glb');}}
   await browser.close();return;
  }
 }
 await browser.close();throw new Error('Render timed out');
})().catch(e=>{console.error(e);process.exit(1)});
