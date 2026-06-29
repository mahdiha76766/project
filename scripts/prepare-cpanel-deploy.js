#!/usr/bin/env node
/**
 * Prepare deploy package for cPanel shared hosting.
 *
 * Recommended workflow (WSL Ubuntu — same Linux as cPanel):
 *   npm ci
 *   npm run build
 *   npm prune --omit=dev
 *   node scripts/prepare-cpanel-deploy.js
 *
 * Then upload listed folders to /home/nedicon1/web
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const REQUIRED = [
  'server.js',
  'next.config.js',
  'package.json',
  'package-lock.json',
  'ecosystem.config.cjs',
  '.next/BUILD_ID',
  'node_modules/next/package.json'
];

const UPLOAD_DIRS = ['.next', 'node_modules', 'public'];
const UPLOAD_FILES = [
  'server.js',
  'next.config.js',
  'package.json',
  'package-lock.json',
  'ecosystem.config.cjs',
  '.npmrc',
  'lib/db/mongo-config.cjs'
];

const SKIP_IN_NEXT = [
  '.next/cache/webpack/client-development',
  '.next/cache/webpack/server-development',
  '.next/cache/webpack/client-development-fallback'
];

function exists(p) {
  return fs.existsSync(path.join(root, p));
}

console.log('=== cPanel deploy check ===\n');

let ok = true;
for (const f of REQUIRED) {
  const yes = exists(f);
  console.log(`${yes ? '✓' : '✗'} ${f}`);
  if (!yes) ok = false;
}

if (!ok) {
  console.error('\nBuild or install missing. Run: npm ci && npm run build');
  process.exit(1);
}

// Warn about Windows SWC on Linux server
const swcLinux = exists('node_modules/@next/swc-linux-x64-gnu');
const swcWin = exists('node_modules/@next/swc-win32-x64-msvc');
if (swcWin && !swcLinux) {
  console.warn('\n⚠ node_modules is Windows-only (@next/swc-win32).');
  console.warn('  On cPanel Linux run npm ci in WSL/Linux, then upload node_modules again.');
}

for (const cachePath of SKIP_IN_NEXT) {
  const full = path.join(root, cachePath);
  if (fs.existsSync(full)) {
    console.warn(`\n⚠ Remove before upload (dev cache): ${cachePath}`);
  }
}

const manifest = [
  '# Upload to /home/nedicon1/web',
  '# Do NOT upload: .git, app/, components/, src/, devDependencies source',
  '',
  '## Directories',
  ...UPLOAD_DIRS.map((d) => `- ${d}/`),
  '',
  '## Files',
  ...UPLOAD_FILES.map((f) => `- ${f}`),
  '',
  '## On server create manually',
  '- .env  (copy from .env.example, set MONGODB_URI, AUTH_SECRET, APP_BASE_URL, PORT)',
  '- uploads/  (auto-created by server.js — persist user images; do NOT delete on redeploy)',
  '',
  '## cPanel Node.js Application',
  '- Application root: /home/nedicon1/web',
  '- Application startup file: server.js',
  '- Node.js version: 20.x',
  '- Environment: NODE_ENV=production',
  '',
  '## After upload (SSH)',
  'chmod +x node_modules/.bin/*',
  'pm2 delete nedico.net || true',
  'pm2 start ecosystem.config.cjs',
  'pm2 save',
  '',
  '## Or cPanel UI',
  'Stop app → Start app (ensures NODE_ENV=production)',
  ''
].join('\n');

const outPath = path.join(root, 'deploy-manifest.txt');
fs.writeFileSync(outPath, manifest, 'utf8');
console.log(`\n✓ Wrote ${outPath}`);
console.log('\nNext: upload items from manifest to server.');
