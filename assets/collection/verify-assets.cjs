const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const project=process.env.SONA_PROJECT_ROOT||path.resolve(__dirname,'../..'),sharp=require(require.resolve('sharp',{paths:[project]})),target=process.env.SONA_EXPORT_DIR||path.resolve(project,'public/images');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const sources=['model.js','studio.js','render.js','index.html','browser.cjs','serve.cjs','capture.cjs','export-source.cjs','export-web.cjs','verify-assets.cjs'];
(async()=>{
 const check=process.argv.includes('--check'),manifest={sourceHashes:{},geometry:JSON.parse(fs.readFileSync(path.join(__dirname,'geometry-verification.json'),'utf8')),renders:{},web:{},glb:{}};
 for(const name of sources)manifest.sourceHashes[name]=hash(fs.readFileSync(path.join(__dirname,name)));
 for(const product of ['dot','room']){
  const stats=manifest.geometry[product].stats;if(['graphite','fig'].some(f=>JSON.stringify(stats[f])!==JSON.stringify(stats.pearl)))throw Error(product+' geometry alignment differs');
  for(const variant of ['pearl-square','graphite-square','fig-square','pearl-macro']){
   const name=`${product}-${variant}.png`,data=fs.readFileSync(path.join(__dirname,name)),info=await sharp(data).metadata(),macro=variant.endsWith('macro');
   if(info.width!==(macro?1400:1100)||info.height!==(macro?1000:1100))throw Error(name+' dimensions differ');
   const raw=await sharp(data).ensureAlpha().raw().toBuffer();let notOpaque=0;for(let i=3;i<raw.length;i+=4)if(raw[i]!==255)notOpaque++;
   const capture=JSON.parse(fs.readFileSync(path.join(__dirname,name.replace('.png','.capture.json')),'utf8'));if(capture.completedSamples!==capture.requestedSamples)throw Error(name+' incomplete sample count');
   manifest.renders[name]={sha256:hash(data),width:info.width,height:info.height,nonOpaquePixels:notOpaque,capture};
  }
  const glb=fs.readFileSync(path.join(__dirname,`${product}-original.glb`));if(glb.subarray(0,4).toString()!=='glTF')throw Error('Invalid GLB');manifest.glb[product]={sha256:hash(glb),bytes:glb.length};
  for(const finish of ['pearl','graphite','fig'])for(const width of [1100,550]){const name=`${product}-${finish}-${width}.webp`,data=fs.readFileSync(path.join(target,name)),info=await sharp(data).metadata();if(info.width!==width||info.height!==width||info.hasAlpha)throw Error(name+' export dimensions/alpha differ');manifest.web[name]={sha256:hash(data),width:info.width,height:info.height,bytes:data.length};}
  const name=`${product}-detail.webp`,data=fs.readFileSync(path.join(target,name)),info=await sharp(data).metadata();if(info.width!==1100||info.height!==786||info.hasAlpha)throw Error(name+' macro dimensions/alpha differ');manifest.web[name]={sha256:hash(data),width:info.width,height:info.height,bytes:data.length};
 }
 const file=path.join(__dirname,'asset-verification.json');if(check){if(JSON.stringify(JSON.parse(fs.readFileSync(file,'utf8')))!==JSON.stringify(manifest))throw Error('Frozen source/render/export manifest differs');}else fs.writeFileSync(file,JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({result:check?'Frozen assets verified':'Frozen asset manifest recorded',originalRenders:Object.keys(manifest.renders).length,webExports:Object.keys(manifest.web).length,products:Object.fromEntries(Object.entries(manifest.geometry).map(([p,g])=>[p,g.stats.pearl])),renderTransparency:Object.fromEntries(Object.entries(manifest.renders).map(([n,v])=>[n,v.nonOpaquePixels]))},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
