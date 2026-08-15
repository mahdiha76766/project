/**
 * محصولات Mongo که در اکسل نیستند را اضافه می‌کند + remirror شیت قیمت.
 *
 * Usage (on server, inside project folder):
 *   npx tsx --import ./scripts/register-server-only-shim.mts scripts/reconcile-excel-products.mts
 *   npm run excel:reconcile
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const root = path.join(__dirname, '..');
loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

async function main() {
  const { resolveProductsExcelPath } = await import('../lib/admin/product-excel-import');
  const { reconcileMissingProductsToExcel } = await import('../lib/admin/product-excel-ensure');
  const { remirrorPriceSheetFromSitePrices } = await import('../lib/admin/product-excel-sync');

  const custom = process.argv[2];
  let filePath = custom
    ? path.isAbsolute(custom)
      ? custom
      : path.join(process.cwd(), custom)
    : resolveProductsExcelPath();

  // اگر مسیر env روی این ماشین وجود ندارد، uploads محلی پروژه را استفاده کن
  if (!fs.existsSync(filePath)) {
    const local = path.join(root, 'uploads', 'products.xlsx');
    if (fs.existsSync(local)) {
      console.warn('[reconcile] UPLOADS_DIR missing here; using local:', local);
      filePath = local;
    }
  }

  console.log('[reconcile] excel:', filePath);
  console.log('[reconcile] scanning Mongo vs Excel...');
  const reconcile = await reconcileMissingProductsToExcel(filePath);
  console.log('[reconcile] result:', {
    totalProducts: reconcile.totalProducts,
    missingCount: reconcile.missingCount,
    createdCount: reconcile.createdCount,
    failed: reconcile.failed
  });
  if (reconcile.created.length) {
    console.log(
      '[reconcile] created sample:',
      reconcile.created.slice(0, 30).map((c) => c.name)
    );
  }

  console.log('[reconcile] remirroring price sheet...');
  const remirror = await remirrorPriceSheetFromSitePrices(filePath);
  console.log('[reconcile] remirror:', remirror);
}

main().catch((error) => {
  console.error('[reconcile] failed:', error);
  process.exit(1);
});
