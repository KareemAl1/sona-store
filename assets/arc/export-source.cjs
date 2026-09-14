const {chromium}=require('playwright');
const fs=require('fs');const path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.SONA_BROWSER_PATH || (fs.existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe') ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined),args:['--disable-gpu-sandbox','--enable-unsafe-swiftshader','--no-sandbox','--use-angle=d3d11']});
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4179/?mode=raster&width=200&height=300');
 await page.waitForFunction(()=>window.statusInfo?.stage==='complete');
 const result=await page.evaluate(async()=>{
  const THREE=await import('three');const {weaveTexture,buildHeadphones}=await import('./model.js');
  const textures=weaveTexture(),stats={};
  for(const finish of ['pearl','graphite','fig']){
   const assembly=buildHeadphones(finish);assembly.updateMatrixWorld(true);let triangles=0,meshes=0;
   assembly.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});
   const box=new THREE.Box3().setFromObject(assembly);stats[finish]={meshes,triangles,bounds:{min:box.min.toArray(),max:box.max.toArray()}};
  }
  return {height:textures.height.image.toDataURL('image/png'),normal:textures.normal.image.toDataURL('image/png'),stats};
 });
 for(const name of ['height','normal'])fs.writeFileSync(path.join(__dirname,`sona-original-weave-${name}.png`),Buffer.from(result[name].split(',')[1],'base64'));
 fs.writeFileSync(path.join(__dirname,'geometry-verification.json'),JSON.stringify(result.stats,null,2));
 console.log(JSON.stringify(result.stats));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
