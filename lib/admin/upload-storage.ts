import fs from 'fs/promises';
import path from 'path';

/** پوشه پایدار آپلود — بیرون از public تا با دیپلوی پاک نشود */
export function getUploadsRoot() {
  return path.join(process.cwd(), 'uploads');
}

export function getUploadsPublicUrl(relativePath: string) {
  const normalized = relativePath.replaceAll('\\', '/').replace(/^\/+/, '');
  return `/${normalized}`;
}

export async function ensureUploadFolders() {
  const root = getUploadsRoot();
  const folders = ['banners', 'products', 'blog', 'categories', 'videos', 'receipts'];
  await Promise.all(folders.map((f) => fs.mkdir(path.join(root, f), { recursive: true })));
  return root;
}

export function resolveUploadDiskPath(relativeDir: string, filename: string) {
  const root = getUploadsRoot();
  const dir = path.join(root, relativeDir);
  return { dir, filePath: path.join(dir, filename) };
}
