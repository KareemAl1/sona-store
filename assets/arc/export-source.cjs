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
      const { weaveTexture, buildHeadphones } = await import('./model.js');
      const textures = weaveTexture();
      const stats = {};
      for (const finish of ['pearl', 'graphite', 'fig']) {
        const assembly = buildHeadphones(finish);
        assembly.updateMatrixWorld(true);
        let triangles = 0;
        let meshes = 0;
        assembly.traverse(mesh => {
          if (mesh.isMesh) {
            meshes++;
            triangles += (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3;
          }
        });
        const box = new THREE.Box3().setFromObject(assembly);
        stats[finish] = { meshes, triangles, bounds: { min: box.min.toArray(), max: box.max.toArray() } };
      }
      return {
        height: textures.height.image.toDataURL('image/png'),
        normal: textures.normal.image.toDataURL('image/png'),
        glb: await window.exportGeometry(),
        stats,
      };
    });
    if (['graphite', 'fig'].some(finish => JSON.stringify(result.stats[finish]) !== JSON.stringify(result.stats.pearl))) {
      throw new Error('Finish geometry differs. No source exports were written.');
    }
    for (const name of ['height', 'normal']) {
      fs.writeFileSync(path.join(__dirname, `sona-original-weave-${name}.png`), Buffer.from(result[name].split(',')[1], 'base64'));
    }
    fs.writeFileSync(path.join(__dirname, 'sona-arc-original.glb'), Buffer.from(result.glb.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(__dirname, 'geometry-verification.json'), JSON.stringify(result.stats, null, 2));
    console.log(JSON.stringify(result.stats, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
