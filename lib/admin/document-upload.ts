import fs from 'fs/promises';
import path from 'path';
import { normalizeStoredPath } from '@/lib/admin/image-upload';
import {
  ensureUploadFolders,
  getUploadsPublicUrl,
  resolveUploadDiskPath
} from '@/lib/admin/upload-storage';

const MAX_PDF_SIZE = 15 * 1024 * 1024;
const PDF_TYPES = new Set(['application/pdf']);
const ALLOWED_FOLDERS = new Set(['downloads', 'media']);

function looksLikePdf(buffer: Buffer, fileName: string, mime: string) {
  const header = buffer.subarray(0, 5).toString('utf8');
  const extOk = /\.pdf$/i.test(fileName);
  return header.startsWith('%PDF') && (PDF_TYPES.has(mime) || extOk);
}

export async function saveAdminPdf(file: File, folder = 'downloads') {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('پوشه آپلود برای فایل مجاز نیست.');
  }
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('حجم فایل باید کمتر از ۱۵ مگابایت باشد.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!looksLikePdf(buffer, file.name || '', file.type)) {
    throw new Error('فقط فایل PDF معتبر مجاز است.');
  }

  await ensureUploadFolders();
  const filename = file.name || `document-${Date.now()}.pdf`;
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const uniqueName = `${Date.now()}-${safeName}`;
  const relativeDir = path.join('uploads', folder).replaceAll('\\', '/');
  const { dir, filePath } = resolveUploadDiskPath(folder, uniqueName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  const url = getUploadsPublicUrl(path.join(relativeDir, uniqueName).replaceAll('\\', '/'));
  return {
    url: normalizeStoredPath(url),
    filename: uniqueName,
    size: buffer.length,
    mimeType: 'application/pdf',
    type: 'pdf' as const
  };
}
