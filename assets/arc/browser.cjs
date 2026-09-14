const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

function isFile(filename) {
  try { return fs.statSync(filename).isFile(); } catch { return false; }
}

function browserPath() {
  if (process.env.SONA_BROWSER_PATH) {
    const explicit = path.resolve(process.env.SONA_BROWSER_PATH);
    if (!isFile(explicit)) throw new Error('SONA_BROWSER_PATH must point to a browser executable.');
    return explicit;
  }

  const candidates = process.platform === 'win32'
    ? [process.env['ProgramFiles(x86)'], process.env.ProgramFiles, process.env.LOCALAPPDATA]
      .filter(Boolean).map(base => path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
    : process.platform === 'darwin'
      ? ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
      : ['/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable', '/opt/microsoft/msedge/msedge'];
  return candidates.find(isFile);
}

function launchBrowser() {
  const executablePath = browserPath();
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: [
      '--disable-gpu-sandbox',
      '--enable-unsafe-swiftshader',
      ...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []),
    ],
  });
}

module.exports = { launchBrowser };
