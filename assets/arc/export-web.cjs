const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

(async () => {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check') || args.length > 1) throw new Error('Usage: node assets/arc/export-web.cjs [--check]');
  const check = args.includes('--check');
  const output = path.resolve(__dirname, '../../public/images');
  const jobs = ['pearl', 'graphite', 'fig'].flatMap(finish => [1100, 550].map(size => ({
    source: `sona-${finish}-square.png`, name: `arc-${finish}-${size}.webp`,
    width: size, height: size, quality: size === 1100 ? 88 : 85,
  })));
  jobs.push({ source: 'sona-pearl-detail-path.png', name: 'arc-detail.webp', width: 1100, height: 700, quality: 90 });

  // Decode and validate every original before any output is written.
  const sources = new Map();
  for (const source of new Set(jobs.map(job => job.source))) {
    const buffer = await fs.readFile(path.join(__dirname, source));
    const metadata = await sharp(buffer).metadata();
    const expected = source.includes('-square.') ? 1100 : 1200;
    if (metadata.format !== 'png' || metadata.width !== expected || metadata.height !== expected) {
      throw new Error(`Expected original ${expected}x${expected} PNG: ${source}`);
    }
    sources.set(source, buffer);
  }
  if (!check) await fs.mkdir(output, { recursive: true });
  const results = [];
  for (const job of jobs) {
    const buffer = await sharp(sources.get(job.source))
      .resize({ width: job.width, height: job.height, fit: 'cover', position: 'centre' })
      .webp({ quality: job.quality })
      .toBuffer();
    const file = path.join(output, job.name);
    if (check) {
      if (!(await fs.readFile(file)).equals(buffer)) throw new Error(`Web export differs from its original/settings: ${job.name}`);
    } else {
      await fs.writeFile(file, buffer);
    }
    results.push({ name: job.name, width: job.width, height: job.height, quality: job.quality, bytes: buffer.length,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex') });
  }
  console.log(JSON.stringify({ mode: check ? 'verified' : 'exported', assets: results }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
