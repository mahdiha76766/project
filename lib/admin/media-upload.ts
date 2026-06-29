import fs from 'fs/promises';
import path from 'path';
import { normalizeStoredPath } from '@/lib/admin/image-upload';
import {
  ensureUploadFolders,
  getUploadsPublicUrl,
  resolveUploadDiskPath
} from '@/lib/admin/upload-storage';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const ALLOWED_FOLDERS = new Set(['categories', 'products', 'blog', 'banners']);

export type UploadedMedia = {
  url: string;
  filename: string;
  type: 'image' | 'video';
};

export async function saveAdminMedia(file: File, folder: string): Promise<UploadedMedia> {
  if (!ALLOWED_FOLDERS.has(folder)) throw new Error('پوشه آپلود مجاز نیست.');

  const isVideo = VIDEO_TYPES.has(file.type) || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
  const isImage = IMAGE_TYPES.has(file.type);

  if (!isVideo && !isImage) {
    throw new Error('فرمت فایل مجاز نیست. (تصویر: JPG, PNG, WEBP, GIF — ویدیو: MP4, WEBM)');
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    throw new Error(isVideo ? 'حجم ویدیو باید کمتر از ۵۰ مگابایت باشد.' : 'حجم تصویر باید کمتر از ۳ مگابایت باشد.');
  }

  await ensureUploadFolders();

  const sub = isVideo ? 'videos' : folder;
  const filename = file.name || `${isVideo ? 'video' : 'image'}-${Date.now()}`;
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const uniqueName = `${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const relativePath = path.join('uploads', sub, uniqueName).replaceAll('\\', '/');
  const { dir, filePath } = resolveUploadDiskPath(sub, uniqueName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const url = getUploadsPublicUrl(relativePath);
  console.info('[upload][media] saved', { folder: sub, type: isVideo ? 'video' : 'image', url, bytes: buffer.length });

  return {
    url: normalizeStoredPath(url),
    filename: uniqueName,
    type: isVideo ? 'video' : 'image'
  };
}
