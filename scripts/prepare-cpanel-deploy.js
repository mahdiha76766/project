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
  'postcss.config.js',
  'tailwind.config.js',
  'package.json',
  'package-lock.json',
  'ecosystem.config.cjs',
  '.npmrc',
  'lib/db/mongo-config.cjs',
  'lib/admin/upload-storage.cjs'
];

function assertTailwindCompiled() {
  const cssDir = path.join(root, '.next', 'static', 'css');
  if (!fs.existsSync(cssDir)) {
    console.error('\n✗ Missing .next/static/css — run npm run build first');
    process.exit(1);
  }

  const cssFiles = fs
    .readdirSync(cssDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.css'))
    .map((e) => path.join(cssDir, e.name));

  const bad = cssFiles.filter((file) => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('@tailwind') || content.includes('@apply');
  });

  if (bad.length) {
    console.error('\n✗ Tailwind CSS was NOT compiled. Site will look broken without styles.');
    console.error('  Unprocessed files:', bad.map((f) => path.basename(f)).join(', '));
    console.error('  Fix: run full install then build (never build after npm prune --omit=dev):');
    console.error('    npm ci && npm run build');
    process.exit(1);
  }

  const main = cssFiles
    .map((file) => ({ file, size: fs.statSync(file).size }))
    .sort((a, b) => b.size - a.size)[0];

  if (main && main.size < 20_000) {
    console.warn(`\n⚠ Largest CSS is only ${main.size} bytes (${path.basename(main.file)}).`);
    console.warn('  Expected ~50KB+ for Tailwind. Rebuild with devDependencies installed.');
  } else if (main) {
    console.log(`\n✓ Tailwind CSS compiled (${path.basename(main.file)}: ${main.size} bytes)`);
  }
}

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

assertTailwindCompiled();

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
  '- .env  (copy from .env.example; set MONGODB_URI, AUTH_SECRET, APP_BASE_URL, UPLOADS_DIR, PORT)',
  '- UPLOADS_DIR=/home/nedicon1/web/uploads   ← must be absolute path on cPanel',
  '- uploads/  (persist user images/excel; do NOT delete on redeploy)',
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
  '## IMPORTANT — CSS / Tailwind',
  '- Always build locally: npm ci && npm run build && npm run deploy:check',
  '- Upload the whole .next/ folder from that build',
  '- Do NOT run npm run build on server after npm prune --omit=dev',
  '- If styles break, CSS contains raw @tailwind — rebuild and re-upload .next/static/css/',
  '',
  '## Or cPanel UI',
  'Stop app → Start app (ensures NODE_ENV=production)',
  ''
].join('\n');

const outPath = path.join(root, 'deploy-manifest.txt');
fs.writeFileSync(outPath, manifest, 'utf8');
console.log(`\n✓ Wrote ${outPath}`);
console.log('\nNext: upload items from manifest to server.');
