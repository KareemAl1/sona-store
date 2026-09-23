const fs = require('node:fs');
const path = require('node:path');
const { launchBrowser } = require('./browser.cjs');

(async () => {
  const args = process.argv.slice(2);
  const finish = args[0] || 'pearl';
  const mode = args[1] || 'path';
  const width = Number(args[2] || 1100);
  const height = Number(args[3] || 1500);
  const samples = Number(args[4] || 128);
  const detail = args.includes('detail');
  if (!['pearl', 'graphite', 'fig'].includes(finish) || !['path', 'raster'].includes(mode)
    || ![width, height].every(value => Number.isInteger(value) && value >= 128 && value <= 8192)
    || !Number.isInteger(samples) || samples < 1 || samples > 4096
    || args.slice(5).some(arg => arg !== 'detail')) {
    throw new Error('Usage: node assets/arc/capture.cjs <pearl|graphite|fig> <path|raster> <width> <height> <samples> [detail]');
  }

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on('console', message => console.log(message.type(), message.text()));
    page.on('pageerror', error => console.error(error));
    const query = new URLSearchParams({ finish, mode, width, height, samples });
    if (detail) query.set('detail', '1');
    await page.goto(`http://127.0.0.1:4179/?${query}`);
    for (let attempt = 0; attempt < 240; attempt++) {
      await page.waitForTimeout(5000);
      const status = await page.evaluate(() => window.statusInfo);
      console.log(JSON.stringify(status));
      if (status?.stage !== 'complete') continue;
      const square = width === height && !detail;
      const name = detail ? `sona-${finish}-macro${mode === 'raster' ? '-raster' : ''}.png` : square ? `sona-${finish}-square.png` : `sona-${finish}-${mode}.png`;
      const data = await page.evaluate(() => window.capture());
      fs.writeFileSync(path.join(__dirname, name), Buffer.from(data.split(',')[1], 'base64'));
      console.log(`SAVED ${name}`);
      if (finish === 'pearl' && !detail && !square) {
        const glb = await page.evaluate(() => window.exportGeometry());
        fs.writeFileSync(path.join(__dirname, 'sona-arc-original.glb'), Buffer.from(glb.split(',')[1], 'base64'));
        console.log('SAVED sona-arc-original.glb');
      }
      return;
    }
    throw new Error('Render timed out after 20 minutes.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
