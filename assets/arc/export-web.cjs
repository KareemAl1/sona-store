const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const defaultOutput = path.resolve(__dirname, '../../public/images');
const jobs = ['pearl', 'graphite', 'fig'].flatMap(finish => [1100, 550].map(size => ({
  source: `sona-${finish}-square.png`, name: `arc-${finish}-${size}.webp`,
  sourceWidth: 1100, sourceHeight: 1100, width: size, height: size,
  quality: size === 1100 ? 92 : 90,
})));
jobs.push({ source: 'sona-pearl-macro.png', name: 'arc-detail.webp',
  sourceWidth: 1400, sourceHeight: 1000, width: 1100, height: 786, quality: 92 });

async function exportWeb({ check = false, output = defaultOutput } = {}) {
  // Validate every original before writing any output. The macro is resized by
  // width only: Sharp rounds its proportional height to 786 without cropping.
  const sources = new Map();
  for (const job of jobs) {
    if (sources.has(job.source)) continue;
    const buffer = await fs.readFile(path.join(__dirname, job.source));
    const metadata = await sharp(buffer).metadata();
    if (metadata.format !== 'png' || metadata.width !== job.sourceWidth || metadata.height !== job.sourceHeight) {
      throw new Error(`Expected ${job.sourceWidth}x${job.sourceHeight} PNG: ${job.source}`);
    }
    sources.set(job.source, buffer);
  }
  const rendered = [];
  for (const job of jobs) {
    // The path-traced macro has 15 transparent samples inside its near-black
    // cavity. Preserve that original and composite the web image onto the cavity
    // shade so the page cannot show through those samples.
    const buffer = await sharp(sources.get(job.source)).flatten({ background: '#0d0a10' }).resize({ width: job.width })
      .webp({ quality: job.quality }).toBuffer();
    const metadata = await sharp(buffer).metadata();
    if (metadata.width !== job.width || metadata.height !== job.height) throw new Error(`Wrong export dimensions: ${job.name}`);
    rendered.push({ job, buffer });
  }
  if (!check) await fs.mkdir(output, { recursive: true });
  const assets = [];
  for (const { job, buffer } of rendered) {
    const filename = path.join(output, job.name);
    if (check) {
      if (!(await fs.readFile(filename)).equals(buffer)) throw new Error(`Web export differs from original/settings: ${job.name}`);
    } else await fs.writeFile(filename, buffer);
    assets.push({ name: job.name, source: job.source, width: job.width, height: job.height,
      quality: job.quality, resize: 'proportional-width-no-crop', opaqueBackground: '#0d0a10', bytes: buffer.length,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex') });
  }
  return assets;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => arg !== '--check')) {
    console.error('Usage: node assets/arc/export-web.cjs [--check]'); process.exitCode = 1;
  } else exportWeb({ check: args.includes('--check') }).then(assets => {
    console.log(JSON.stringify({ mode: args.includes('--check') ? 'verified' : 'exported', assets }, null, 2));
  }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { exportWeb, jobs, defaultOutput };
