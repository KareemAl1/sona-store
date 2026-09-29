const fs=require('node:fs');const path=require('node:path');const {launchBrowser}=require('./browser.cjs');
(async()=>{
 const check=process.argv.includes('--check'),browser=await launchBrowser();try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:4180/?mode=raster&width=200&height=200');await page.waitForFunction(()=>window.statusInfo?.stage==='complete');
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{buildProduct,createScene,CAMERAS}=await import('./model.js'),{GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const products={};
   const hex=buffer=>[...new Uint8Array(buffer)].map(n=>n.toString(16).padStart(2,'0')).join('');
   for(const product of ['dot','room']){
    const stats={},cameraInfo={};let pearl;
    for(const kind of ['hero','macro']){const camera=createScene(product,'pearl',kind==='macro').camera;camera.updateMatrixWorld(true);cameraInfo[kind]={...CAMERAS[product][kind],aspect:camera.aspect,quaternion:camera.quaternion.toArray(),matrixWorld:camera.matrixWorld.toArray(),projectionMatrix:camera.projectionMatrix.toArray()};}
    for(const finish of ['pearl','graphite','fig']){
     const assembly=buildProduct(product,finish);if(finish==='pearl')pearl=assembly;assembly.updateMatrixWorld(true);const chunks=[],projected={min:[Infinity,Infinity],max:[-Infinity,-Infinity]};let meshes=0,triangles=0;const camera=createScene(product,finish,false).camera;camera.updateMatrixWorld(true);
     assembly.traverse(mesh=>{if(!mesh.isMesh)return;meshes++;triangles+=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;chunks.push(new Uint8Array(new Float64Array(mesh.matrixWorld.elements).buffer));for(const key of ['position','normal','uv']){const a=mesh.geometry.getAttribute(key);if(a)chunks.push(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(mesh.geometry.index){const a=mesh.geometry.index.array;chunks.push(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));}
      const attr=mesh.geometry.getAttribute('position'),p=new THREE.Vector3();for(let i=0;i<attr.count;i++){p.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld).project(camera);const x=(p.x+1)*550,y=(1-p.y)*550;projected.min[0]=Math.min(projected.min[0],x);projected.min[1]=Math.min(projected.min[1],y);projected.max[0]=Math.max(projected.max[0],x);projected.max[1]=Math.max(projected.max[1],y);}
     });const bytes=new Uint8Array(chunks.reduce((s,c)=>s+c.length,0));let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const box=new THREE.Box3().setFromObject(assembly);
     stats[finish]={meshes,triangles,geometrySha256:hex(await crypto.subtle.digest('SHA-256',bytes)),bounds:{min:box.min.toArray(),max:box.max.toArray()},heroProjectionBounds1100:projected};
    }
    const buffer=await new GLTFExporter().parseAsync(pearl,{binary:true});const glb=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(new Blob([buffer]));});products[product]={stats,cameras:cameraInfo,glb};
   }return products;
  });
  const manifest={};for(const product of ['dot','room']){const r=result[product];if(['graphite','fig'].some(f=>JSON.stringify(r.stats[f])!==JSON.stringify(r.stats.pearl)))throw Error(product+' finishes are not aligned');manifest[product]={stats:r.stats,cameras:r.cameras};if(!check)fs.writeFileSync(path.join(__dirname,`${product}-original.glb`),Buffer.from(r.glb.split(',')[1],'base64'));}
  const file=path.join(__dirname,'geometry-verification.json');if(check){if(JSON.stringify(JSON.parse(fs.readFileSync(file,'utf8')))!==JSON.stringify(manifest))throw Error('Geometry/camera manifest differs');}else fs.writeFileSync(file,JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
