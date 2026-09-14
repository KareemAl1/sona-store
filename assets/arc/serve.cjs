const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = fs.realpathSync(__dirname);
const deps = path.resolve(__dirname, '../../node_modules');
const types = {
  '.js': 'text/javascript', '.cjs': 'text/javascript', '.html': 'text/html',
  '.wasm': 'application/wasm', '.png': 'image/png', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.md': 'text/plain', '.txt': 'text/plain',
};

function contained(base, filename) {
  const relative = path.relative(base, filename);
  return relative === '' || (
    relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
  );
}

function reply(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return reply(res, 405, 'Method not allowed');
  }

  let pathname;
  try {
    const raw = (req.url || '').split('?')[0];
    if (!raw.startsWith('/') || raw.startsWith('//')) return reply(res, 400, 'Invalid asset path');
    pathname = decodeURIComponent(raw);
    if (/[\\\u0000-\u001f\u007f]/u.test(pathname)) return reply(res, 400, 'Invalid asset path');
  } catch {
    return reply(res, 400, 'Invalid asset path');
  }

  const isDependency = pathname.startsWith('/deps/');
  const base = isDependency ? deps : root;
  const relative = isDependency ? pathname.slice(6) : pathname === '/' ? 'index.html' : pathname.slice(1);
  const candidate = path.resolve(base, relative);
  if (!contained(base, candidate)) return reply(res, 403, 'Asset path is outside the studio');

  try {
    // Check the resolved target as well, so a symlink cannot escape either root.
    const [realBase, realFile] = await Promise.all([
      fs.promises.realpath(base), fs.promises.realpath(candidate),
    ]);
    if (!contained(realBase, realFile)) return reply(res, 403, 'Asset path is outside the studio');
    const stat = await fs.promises.stat(realFile);
    if (!stat.isFile()) return reply(res, 404, 'Asset not found');
    const data = req.method === 'HEAD' ? null : await fs.promises.readFile(realFile);
    res.writeHead(200, {
      'Content-Type': types[path.extname(realFile).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
    });
    res.end(data);
  } catch (error) {
    const code = error.code === 'EACCES' || error.code === 'EPERM' ? 403
      : error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404
        : error.code === 'EINVAL' ? 400 : 500;
    reply(res, code, code === 404 ? 'Asset not found' : 'Unable to read asset');
  }
}).listen(4179, '127.0.0.1', () => {
  console.log('Sona geometry studio: http://127.0.0.1:4179');
});
