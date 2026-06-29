/**
 * Custom Next.js server for cPanel / PM2 / shared hosting.
 * Build locally (npm run build), upload .next + node_modules, run with NODE_ENV=production.
 */
const { createServer } = require('http');
const { parse } = require('url');
const fs = require('fs');
const path = require('path');

const {
  applyMongoEnvDefaults,
  maskMongoUri,
  resolveMongoUri
} = require('./lib/db/mongo-config.cjs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  let count = 0;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
      count += 1;
    }
  }
  return count > 0;
}

// ── Load .env / .env.local (cPanel may not inject all vars) ──
const envLoaded = loadEnvFile(path.join(__dirname, '.env'));
const envLocalLoaded = loadEnvFile(path.join(__dirname, '.env.local'));
console.log('[server] env files:', { '.env': envLoaded, '.env.local': envLocalLoaded });

// پیش‌فرض: production (فقط scripts/run-dev.js حالت development می‌گذارد)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

const mongoDefaults = applyMongoEnvDefaults();
const mongo = resolveMongoUri();
console.log('[server] MongoDB config:', {
  source: mongo.source,
  defaultApplied: mongoDefaults.applied,
  uriMasked: maskMongoUri(mongo.uri),
  dbName: mongo.dbName ?? null,
  host: mongo.host ?? null,
  authSourceAdded: mongo.authSourceAdded
});

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

if (!dev) {
  const nextDir = path.join(__dirname, '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('[server] Missing .next folder. Build locally: npm run build');
    process.exit(1);
  }
  // Remove stale dev cache if accidentally uploaded (saves disk / avoids -122 errors)
  const devCache = path.join(nextDir, 'cache', 'webpack', 'client-development-fallback');
  if (fs.existsSync(devCache)) {
    try {
      fs.rmSync(devCache, { recursive: true, force: true });
      console.warn('[server] Removed dev webpack cache:', devCache);
    } catch (e) {
      console.warn('[server] Could not remove dev cache:', e.message);
    }
  }
}

const UPLOADS_ROOT = path.join(__dirname, 'uploads');
const UPLOAD_FOLDERS = ['banners', 'products', 'blog', 'categories', 'videos'];
for (const folder of UPLOAD_FOLDERS) {
  const dir = path.join(UPLOADS_ROOT, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('[server] created upload folder:', dir);
  }
}
console.log('[server] uploads root:', UPLOADS_ROOT);

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg'
};

function tryServeUpload(req, res, pathname) {
  if (!pathname.startsWith('/uploads/')) return false;
  const rel = pathname.replace(/^\/uploads\//, '');
  if (!rel || rel.includes('..')) {
    res.statusCode = 400;
    res.end('bad path');
    return true;
  }
  let filePath = path.join(UPLOADS_ROOT, rel);
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    res.statusCode = 403;
    res.end('forbidden');
    return true;
  }
  // سازگاری با آپلودهای قدیمی داخل public/uploads
  if (!fs.existsSync(filePath)) {
    const legacyPath = path.join(__dirname, 'public', 'uploads', rel);
    if (legacyPath.startsWith(path.join(__dirname, 'public', 'uploads')) && fs.existsSync(legacyPath)) {
      filePath = legacyPath;
    }
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    console.warn('[server][uploads] 404', pathname, '→', filePath);
    res.statusCode = 404;
    res.end('not found');
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
  return true;
}

const next = require('next');
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

// Try to initialize backup cron job
try {
  const { initializeCronJob } = require('./lib/admin/backup.ts');
  initializeCronJob();
} catch (e) {
  // Ignore in case TS requires build first or transpilation
  console.log('[server] backup cron initialization skipped (requires transpilation first or dev start).');
}

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const pathname = parsedUrl.pathname || '/';
        if (tryServeUpload(req, res, pathname)) return;
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[server] request error:', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    })
      .once('error', (err) => {
        console.error('[server] fatal:', err);
        process.exit(1);
      })
      .listen(port, hostname, () => {
        console.log(`[server] Ready http://${hostname}:${port} mode=${dev ? 'development' : 'production'}`);
      });
  })
  .catch((err) => {
    console.error('[server] prepare failed:', err);
    process.exit(1);
  });
