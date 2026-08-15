import fsp from 'fs/promises';
import path from 'path';

/**
 * Persistent uploads root — ONLY from UPLOADS_DIR.
 * Production example: UPLOADS_DIR=/home/nedicon1/web/uploads
 */
export function resolveUploadsRoot(): string {
  const fromEnv = String(process.env.UPLOADS_DIR || '').trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'UPLOADS_DIR is required in production. Set e.g. UPLOADS_DIR=/home/nedicon1/web/uploads'
    );
  }

  throw new Error(
    'UPLOADS_DIR is required. Set an absolute path in .env (local or server), e.g. UPLOADS_DIR=C:\\...\\uploads'
  );
}

/** پوشه پایدار آپلود — بیرون از public تا با دیپلوی پاک نشود */
export function getUploadsRoot() {
  return resolveUploadsRoot();
}

export function getUploadsPublicUrl(relativePath: string) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\/+/, '');
  return `/${normalized}`;
}

export async function ensureUploadFolders() {
  const root = getUploadsRoot();
  await fsp.mkdir(root, { recursive: true });
  const folders = ['banners', 'products', 'blog', 'categories', 'videos', 'receipts'];
  await Promise.all(folders.map((f) => fsp.mkdir(path.join(root, f), { recursive: true })));
  return root;
}

export function resolveUploadDiskPath(relativeDir: string, filename: string) {
  const root = getUploadsRoot();
  const clean = relativeDir.replaceAll('\\', '/').replace(/^uploads\/?/, '');
  const dir = path.join(root, clean);
  return { dir, filePath: path.join(dir, filename) };
}

/** Absolute path for products.xlsx inside UPLOADS_DIR */
export function resolveProductsExcelDiskPath() {
  return path.join(getUploadsRoot(), 'products.xlsx');
}
