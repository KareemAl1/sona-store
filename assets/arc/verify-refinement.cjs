const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const { launchBrowser } = require('./browser.cjs');
const { exportWeb, defaultOutput } = require('./export-web.cjs');

const digest = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const read = name => fs.readFile(path.join(__dirname, name));
const readJson = async name => JSON.parse(await read(name));

async function verifyRefinement({ check = false, output = defaultOutput } = {}) {
  const sourceNames = ['model.js', 'render.js', 'capture.cjs', 'export-source.cjs',
    'export-web.cjs', 'verify-refinement.cjs', 'browser.cjs', 'serve.cjs', 'index.html'];
  const sourceHashes = {};
  for (const name of sourceNames) sourceHashes[name] = digest(await read(name));
  const retained = [];
  const imageNames = ['pearl', 'graphite', 'fig'].map(finish => `sona-${finish}-square.png`)
    .concat('sona-pearl-macro.png', ...['height', 'normal', 'albedo', 'roughness'].map(kind => `sona-original-weave-${kind}.png`));
  for (const name of imageNames) {
    const buffer = await read(name), metadata = await sharp(buffer).metadata();
    const expected = name.includes('-square') ? [1100, 1100] : name.includes('-macro') ? [1400, 1000] : [1024, 1024];
    assert.equal(metadata.format, 'png', name);
    assert.deepEqual([metadata.width, metadata.height], expected, name);
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparentPixels = 0;
    const alphaBounds = { min: [Infinity, Infinity], max: [-Infinity, -Infinity] };
    for (let i = 3; i < data.length; i += info.channels) if (data[i] !== 255) {
      transparentPixels++;
      const pixel = (i - 3) / info.channels, x = pixel % info.width, y = Math.floor(pixel / info.width);
      alphaBounds.min[0] = Math.min(alphaBounds.min[0], x); alphaBounds.min[1] = Math.min(alphaBounds.min[1], y);
      alphaBounds.max[0] = Math.max(alphaBounds.max[0], x); alphaBounds.max[1] = Math.max(alphaBounds.max[1], y);
    }
    retained.push({ name, width: metadata.width, height: metadata.height, bytes: buffer.length, sha256: digest(buffer),
      transparentPixels, transparentBounds: transparentPixels ? alphaBounds : null });
  }
  const browser = await launchBrowser();
  let actual;
  try {
    const page = await browser.newPage();
    // Use the studio import map but avoid starting a product render.
    await page.route('**/render.js', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.goto('http://127.0.0.1:4179/');
    actual = await page.evaluate(async () => {
      const THREE = await import('three');
      const { buildHeadphones, createScene } = await import('./model.js');
      const hash = async data => [...new Uint8Array(await crypto.subtle.digest('SHA-256', data))].map(n => n.toString(16).padStart(2, '0')).join('');
      const modelSourceHash = await hash(await (await fetch('./model.js')).arrayBuffer());
      const stats = {}, cameras = {}, targetDirectionErrors = {};
      for (const [view, detail, aspect, target] of [['hero', false, 1, [0, 1.94, 0]], ['macro', true, 1.4, [.74, 1.34, .1]]]) {
        const camera = createScene('pearl', detail).camera;
        camera.aspect = aspect; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
        cameras[view] = { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov,
          aspect: camera.aspect, near: camera.near, far: camera.far, projectionMatrix: camera.projectionMatrix.toArray(), target };
        const expectedDirection = new THREE.Vector3(...target).sub(camera.position).normalize();
        targetDirectionErrors[view] = camera.getWorldDirection(new THREE.Vector3()).distanceTo(expectedDirection);
      }
      const heroCamera = createScene('pearl', false).camera;
      heroCamera.aspect = 1; heroCamera.updateProjectionMatrix(); heroCamera.updateMatrixWorld(true);
      for (const finish of ['pearl', 'graphite', 'fig']) {
        const finishCamera = createScene(finish, false).camera;
        finishCamera.aspect = 1; finishCamera.updateProjectionMatrix(); finishCamera.updateMatrixWorld(true);
        if (!finishCamera.matrixWorld.equals(heroCamera.matrixWorld) || !finishCamera.projectionMatrix.equals(heroCamera.projectionMatrix)) {
          throw new Error(`Hero camera varies for ${finish}`);
        }
        const assembly = buildHeadphones(finish); assembly.updateMatrixWorld(true);
        let meshes = 0, triangles = 0;
        const chunks = [], projected = { min: [Infinity, Infinity], max: [-Infinity, -Infinity] };
        assembly.traverse(mesh => {
          if (!mesh.isMesh) return;
          meshes++; triangles += (mesh.geometry.index?.count || mesh.geometry.attributes.position.count) / 3;
          chunks.push(new Uint8Array(new Float64Array(mesh.matrixWorld.elements).buffer));
          for (const name of ['position', 'normal', 'uv']) {
            const attribute = mesh.geometry.getAttribute(name);
            if (attribute) chunks.push(new Uint8Array(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength));
          }
          if (mesh.geometry.index) {
            const array = mesh.geometry.index.array; chunks.push(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
          }
          const positions = mesh.geometry.getAttribute('position'), point = new THREE.Vector3();
          for (let i = 0; i < positions.count; i++) {
            point.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld).project(heroCamera);
            const x = (point.x + 1) * 550, y = (1 - point.y) * 550;
            projected.min[0] = Math.min(projected.min[0], x); projected.min[1] = Math.min(projected.min[1], y);
            projected.max[0] = Math.max(projected.max[0], x); projected.max[1] = Math.max(projected.max[1], y);
          }
        });
        const joined = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0));
        let offset = 0; for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
        const box = new THREE.Box3().setFromObject(assembly);
        stats[finish] = { meshes, triangles, geometrySha256: await hash(joined), bounds: { min: box.min.toArray(), max: box.max.toArray() }, heroProjectionBounds1100: projected };
      }
      return { stats, cameras, targetDirectionErrors, modelSourceHash, threeRevision: THREE.REVISION };
    });
  } finally { await browser.close(); }
  assert.equal(actual.modelSourceHash, sourceHashes['model.js'], 'Studio is serving different model.js source');
  assert.deepEqual(actual.stats, await readJson('geometry-verification.json'), 'Geometry manifest is stale');
  assert.deepEqual(actual.cameras, await readJson('camera-verification.json'), 'Camera manifest is stale');
  for (const finish of ['graphite', 'fig']) assert.deepEqual(actual.stats[finish], actual.stats.pearl, `Finish alignment differs: ${finish}`);
  assert.deepEqual(actual.cameras.hero.position, [7.2, 3.45, 6.8]);
  assert.equal(actual.cameras.hero.fov, 30);
  for (const [view, error] of Object.entries(actual.targetDirectionErrors)) assert.ok(error < 1e-14, `${view} camera does not look at its documented target`);
  const target = actual.cameras.hero.target;
  // The quaternion and full projection matrix are compared to the frozen camera
  // manifest above; target is additionally documented for reproducible lookAt.
  assert.deepEqual(target, [0, 1.94, 0]);
  assert.equal(actual.stats.pearl.meshes, 34);
  assert.equal(actual.stats.pearl.triangles, 138376);
  const originalBounds = { min: [-1.4251978638655958, 0.014580987837022219, -0.7564733866151034],
    max: [1.4251978638655955, 4.067500114440918, 0.7286089062690735] };
  assert.deepEqual(actual.stats.pearl.bounds, originalBounds, 'Overall original bounds changed');

  const glb = await read('sona-arc-original.glb');
  assert.equal(glb.readUInt32LE(0), 0x46546c67, 'Invalid GLB');
  assert.equal(glb.readUInt32LE(4), 2, 'Expected GLB 2.0');
  assert.equal(glb.readUInt32LE(8), glb.length, 'Truncated GLB');
  assert.equal(glb.readUInt32LE(16), 0x4e4f534a, 'Missing GLB JSON chunk');
  const gltf = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  const glbTriangles = gltf.meshes.flatMap(mesh => mesh.primitives).reduce((sum, primitive) => {
    assert.equal(primitive.mode ?? 4, 4, 'Expected triangle primitives');
    return sum + gltf.accessors[primitive.indices ?? primitive.attributes.POSITION].count / 3;
  }, 0);
  assert.equal(gltf.meshes.length, actual.stats.pearl.meshes, 'GLB mesh count differs');
  assert.equal(glbTriangles, actual.stats.pearl.triangles, 'GLB triangle count differs');
  retained.push({ name: 'sona-arc-original.glb', bytes: glb.length, sha256: digest(glb), meshes: gltf.meshes.length, triangles: glbTriangles });
  const webAssets = await exportWeb({ check: true, output });
  for (const asset of webAssets) {
    const metadata = await sharp(path.join(output, asset.name)).metadata();
    assert.equal(metadata.hasAlpha, false, `Web output must be opaque: ${asset.name}`);
  }
  const result = {
    schemaVersion: 1,
    sourceHashes,
    toolVersions: { sharp: sharp.versions.sharp, vips: sharp.versions.vips, threeRevision: actual.threeRevision },
    geometry: actual.stats, cameras: actual.cameras,
    alignment: { identicalGeometryAndTransformsAcrossFinishes: true, identicalHeroProjectionBoundsAcrossFinishes: true,
      originalOverallBoundsRetained: true, method: 'SHA-256 of each mesh world transform, position/normal/UV arrays and indices in traversal order; all vertices projected with the locked hero camera.' },
    retainedAssets: retained,
    webAssets,
    renderRegeneration: { hero: { width: 1100, height: 1100, samples: 512 }, macro: { width: 1400, height: 1000, samples: 768 },
      note: 'These are regeneration settings. Original sample counts are not encoded in the PNG files; the retained PNG hashes identify the inspected final renders.' },
    originalAlphaDiagnostic: 'Nonopaque original pixels and their bounds are recorded per asset. The WebP pipeline composites all inputs over #0d0a10 and verifies opaque output; original PNG bytes are preserved.',
    historicalAssets: 'Existing portrait PNGs and sona-pearl-detail-path.png predate the refined geometry. They are retained as historical originals and are not inputs to the final website export.',
  };
  if (check) assert.deepEqual(result, await readJson('refinement-verification.json'), 'Refinement manifest differs from current source/assets');
  else await fs.writeFile(path.join(__dirname, 'refinement-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => arg !== '--check')) {
    console.error('Usage: node assets/arc/verify-refinement.cjs [--check]'); process.exitCode = 1;
  } else verifyRefinement({ check: args.includes('--check') }).then(result => {
    console.log(JSON.stringify({ mode: args.includes('--check') ? 'verified' : 'recorded', sourceHashes: result.sourceHashes,
      alignment: result.alignment, retainedAssets: result.retainedAssets.length, webAssets: result.webAssets.length }, null, 2));
  }).catch(error => { console.error(error.stack); process.exitCode = 1; });
}

module.exports = { verifyRefinement };
