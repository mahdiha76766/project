import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ensureUploadFolders, getUploadsPublicUrl, resolveUploadDiskPath } from '@/lib/admin/upload-storage';

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const MAX_BYTES = 4 * 1024 * 1024;

export async function savePaymentReceiptImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('فقط فایل‌های JPEG و PNG مجاز هستند');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('حداکثر حجم فایل ۴ مگابایت است');
  }

  await ensureUploadFolders();
  await fs.mkdir(path.join(process.cwd(), 'uploads', 'receipts'), { recursive: true });

  const ext = file.type === 'image/png' ? '.png' : '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const { filePath } = resolveUploadDiskPath('receipts', filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const relative = `uploads/receipts/${filename}`;
  return {
    imagePath: relative,
    imageUrl: getUploadsPublicUrl(relative)
  };
}

export async function deleteReceiptFile(imagePath: string) {
  if (!imagePath) return;
  const normalized = imagePath.replace(/^\/+/, '').replaceAll('\\', '/');
  if (!normalized.startsWith('uploads/receipts/')) return;
  const full = path.join(process.cwd(), normalized);
  try {
    await fs.unlink(full);
  } catch {
    /* ignore missing */
  }
}
