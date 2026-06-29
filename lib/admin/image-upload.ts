import fs from 'fs/promises';
import path from 'path';
import {
  ensureUploadFolders,
  getUploadsPublicUrl,
  resolveUploadDiskPath
} from '@/lib/admin/upload-storage';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FOLDERS = new Set(['categories', 'products', 'blog', 'banners']);

export const normalizeStoredPath = (p: string) => (p.startsWith('/') ? p : `/${p}`);

export async function saveAdminImage(file: File, folder: string) {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('پوشه آپلود مجاز نیست.');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('فرمت تصویر مجاز نیست. (JPG, PNG, WEBP, GIF)');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('حجم تصویر باید کمتر از ۳ مگابایت باشد.');
  }

  await ensureUploadFolders();

  const filename = file.name || `image-${Date.now()}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const relativeDir = path.join('uploads', folder).replaceAll('\\', '/');
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const uniqueName = `${Date.now()}-${safeName}`;
  const { dir, filePath } = resolveUploadDiskPath(folder, uniqueName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const url = getUploadsPublicUrl(path.join(relativeDir, uniqueName).replaceAll('\\', '/'));
  console.info('[upload][image] saved', { folder, url, bytes: buffer.length });

  return { url: normalizeStoredPath(url), filename: uniqueName };
}
