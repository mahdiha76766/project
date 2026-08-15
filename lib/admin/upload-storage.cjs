/** CommonJS — keep in sync with lib/admin/upload-storage.ts for server.js */
const path = require('path');

function resolveUploadsRoot() {
  const fromEnv = String(process.env.UPLOADS_DIR || '').trim();
  if (fromEnv) return path.resolve(fromEnv);

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'UPLOADS_DIR is required in production. Set e.g. UPLOADS_DIR=/home/nedicon1/web/uploads'
    );
  }

  throw new Error(
    'UPLOADS_DIR is required. Set an absolute path in .env (local or server).'
  );
}

module.exports = { resolveUploadsRoot };
