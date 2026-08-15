/**
 * بازنویسی شیت قیمت اکسل از وضعیت فعلی پورتال (Mongo).
 * همین کار بعد از هر ذخیره در پورتال خودکار انجام می‌شود.
 *
 * Usage:
 *   npm run excel:remirror
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));

const localUploads = path.join(root, 'uploads');
const envUploads = String(process.env.UPLOADS_DIR || '').trim();
if (!envUploads || !fs.existsSync(envUploads)) {
  process.env.UPLOADS_DIR = localUploads;
}

async function main() {
  console.log('[excel-full-sync] UPLOADS_DIR:', process.env.UPLOADS_DIR);
  const { syncAllPortalProductsToExcel } = await import('../lib/admin/product-excel-full-sync');
  const result = await syncAllPortalProductsToExcel();
  if (!result.ok) {
    console.error('[excel-full-sync] failed:', result);
    process.exit(1);
  }
  console.log('[excel-full-sync] done', result);
}

main().catch((error) => {
  console.error('[excel-full-sync] failed:', error);
  process.exit(1);
});
