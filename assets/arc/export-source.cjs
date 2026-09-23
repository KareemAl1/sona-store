const fs = require('node:fs');
const path = require('node:path');
const { launchBrowser } = require('./browser.cjs');

(async () => {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4179/?mode=raster&width=200&height=300');
    await page.waitForFunction(() => window.statusInfo?.stage === 'complete');
    const result = await page.evaluate(async () => {
      const THREE = await import('three');
      const { weaveTexture, buildHeadphones, createScene } = await import('./model.js');
      const textures = weaveTexture();
      const stats = {};
      const heroCamera=createScene('pearl',false).camera;heroCamera.aspect=1;heroCamera.updateProjectionMatrix();heroCamera.updateMatrixWorld(true);
      const macroCamera=createScene('pearl',true).camera;macroCamera.aspect=1400/1000;macroCamera.updateProjectionMatrix();macroCamera.updateMatrixWorld(true);
      const cameraData=camera=>({position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect,near:camera.near,far:camera.far,projectionMatrix:camera.projectionMatrix.toArray()});
      const cameras={hero:{...cameraData(heroCamera),target:[0,1.94,0]},macro:{...cameraData(macroCamera),target:[.74,1.34,.1]}};
      for (const finish of ['pearl', 'graphite', 'fig']) {
        const assembly = buildHeadphones(finish);
        assembly.updateMatrixWorld(true);
        let triangles = 0;
        let meshes = 0;
        const chunks=[],projected={min:[Infinity,Infinity],max:[-Infinity,-Infinity]};
        assembly.traverse(mesh => {
          if (mesh.isMesh) {
            meshes++;
            triangles += (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3;
            chunks.push(new Uint8Array(new Float64Array(mesh.matrixWorld.elements).buffer));
            for(const name of ['position','normal','uv']){const attr=mesh.geometry.getAttribute(name);if(attr)chunks.push(new Uint8Array(attr.array.buffer,attr.array.byteOffset,attr.array.byteLength));}
            if(mesh.geometry.index){const a=mesh.geometry.index.array;chunks.push(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));}
            const position=mesh.geometry.getAttribute('position'),point=new THREE.Vector3();
            for(let i=0;i<position.count;i++){
              point.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld).project(heroCamera);
              const x=(point.x+1)*550,y=(1-point.y)*550;
              projected.min[0]=Math.min(projected.min[0],x);projected.min[1]=Math.min(projected.min[1],y);
              projected.max[0]=Math.max(projected.max[0],x);projected.max[1]=Math.max(projected.max[1],y);
            }
          }
        });
        const box = new THREE.Box3().setFromObject(assembly);
        const joined=new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.byteLength,0));let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}
        const digest=await crypto.subtle.digest('SHA-256',joined),geometrySha256=[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');
        stats[finish] = { meshes, triangles, geometrySha256, bounds: { min: box.min.toArray(), max: box.max.toArray() },heroProjectionBounds1100:projected };
      }
      return {
        height: textures.height.image.toDataURL('image/png'),
        normal: textures.normal.image.toDataURL('image/png'),
        albedo: textures.albedo.image.toDataURL('image/png'),
        roughness: textures.roughness.image.toDataURL('image/png'),
        glb: await window.exportGeometry(),
        stats,
        cameras,
      };
    });
    if (['graphite', 'fig'].some(finish => JSON.stringify(result.stats[finish]) !== JSON.stringify(result.stats.pearl))) {
      throw new Error('Finish geometry differs. No source exports were written.');
    }
    for (const name of ['height', 'normal', 'albedo', 'roughness']) {
      fs.writeFileSync(path.join(__dirname, `sona-original-weave-${name}.png`), Buffer.from(result[name].split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(__dirname, 'sona-arc-original.glb'), Buffer.from(result.glb.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'geometry-verification.json'), JSON.stringify(result.stats, null, 2));
    fs.writeFileSync(path.join(__dirname, 'camera-verification.json'), JSON.stringify(result.cameras, null, 2));
    console.log(JSON.stringify(result.stats, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
