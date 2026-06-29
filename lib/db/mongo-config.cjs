/** CommonJS — برای server.js و scripts/check-mongo.js */
const DEFAULT_MONGODB_URI =
  'mongodb://nedicon1_web:ZaminKavan1388@212.33.203.189:27017/nedicon1_web';

function parseDbNameFromUri(uri) {
  const base = uri.split('?')[0];
  const slash = base.lastIndexOf('/');
  if (slash < 0 || slash === base.length - 1) return undefined;
  const name = base.slice(slash + 1);
  if (!name || name.includes('@')) return undefined;
  return name;
}

function maskMongoUri(uri) {
  return uri.replace(/\/\/([^:@/]+):([^@/]+)@/, '//$1:***@');
}

function parseMongoHost(uri) {
  const m = uri.match(/@([^/?:]+)/);
  return m ? m[1] : undefined;
}

function ensureAuthSource(uri, dbName) {
  if (!dbName || /[?&]authSource=/i.test(uri)) return uri;
  const sep = uri.includes('?') ? '&' : '?';
  return `${uri}${sep}authSource=${encodeURIComponent(dbName)}`;
}

function resolveMongoUri() {
  const raw = (process.env.MONGODB_URI || '').trim() || DEFAULT_MONGODB_URI;
  const source = (process.env.MONGODB_URI || '').trim() ? 'env' : 'default';
  const dbName = parseDbNameFromUri(raw);
  const withAuth = ensureAuthSource(raw, dbName);
  return {
    uri: withAuth,
    dbName,
    host: parseMongoHost(raw),
    source,
    authSourceAdded: withAuth !== raw
  };
}

function applyMongoEnvDefaults() {
  if (!(process.env.MONGODB_URI || '').trim()) {
    process.env.MONGODB_URI = DEFAULT_MONGODB_URI;
    return { applied: true, source: 'default' };
  }
  return { applied: false, source: 'env' };
}

module.exports = {
  DEFAULT_MONGODB_URI,
  parseDbNameFromUri,
  maskMongoUri,
  parseMongoHost,
  ensureAuthSource,
  resolveMongoUri,
  applyMongoEnvDefaults
};
