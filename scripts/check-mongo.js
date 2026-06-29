/**
 * عیب‌یابی اتصال MongoDB روی سرور (بدون Next.js)
 * Usage: node scripts/check-mongo.js
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
  applyMongoEnvDefaults,
  maskMongoUri,
  resolveMongoUri
} = require('../lib/db/mongo-config.cjs');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
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
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  const root = path.join(__dirname, '..');
  loadEnvFile(path.join(root, '.env'));
  loadEnvFile(path.join(root, '.env.local'));
  const defaults = applyMongoEnvDefaults();
  const resolved = resolveMongoUri();

  console.log('=== MongoDB diagnostic ===');
  console.log('defaultApplied:', defaults.applied);
  console.log('source:', resolved.source);
  console.log('uri (masked):', maskMongoUri(resolved.uri));
  console.log('dbName:', resolved.dbName ?? '(none)');
  console.log('host:', resolved.host ?? '(none)');
  console.log('authSourceAdded:', resolved.authSourceAdded);

  await mongoose.connect(resolved.uri, {
    ...(resolved.dbName ? { dbName: resolved.dbName } : {}),
    serverSelectionTimeoutMS: 10_000
  });

  const active = mongoose.connection.db.databaseName;
  console.log('mongoose.connection.db.databaseName:', active);

  const ping = await mongoose.connection.db.admin().ping();
  console.log('ping:', ping);

  const users = await mongoose.connection.db.collection('users').countDocuments();
  console.log('users collection count:', users);

  await mongoose.disconnect();
  console.log('OK — connection and query authorized');
}

main().catch((err) => {
  console.error('FAILED:', err.name, err.message);
  if (err.code) console.error('code:', err.code, 'codeName:', err.codeName);
  if (err.errorResponse) console.error('errorResponse:', JSON.stringify(err.errorResponse));
  process.exit(1);
});
