import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireContent } from '@/lib/api/guards';
import { getUploadsRoot } from '@/lib/admin/upload-storage';

const MEDIA_FOLDERS = ['media', 'blog', 'products', 'categories', 'banners', 'downloads'] as const;

function publicUrl(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

function isImage(name: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(name);
}

function isPdf(name: string) {
  return /\.pdf$/i.test(name);
}

async function safeUnlink(folder: string, filename: string) {
  const root = getUploadsRoot();
  const cleanName = path.basename(filename);
  const target = path.resolve(root, folder, cleanName);
  const allowed = path.resolve(root, folder);
  if (!target.startsWith(allowed + path.sep) && target !== allowed) {
    throw new Error('مسیر فایل نامعتبر است.');
  }
  await fs.unlink(target);
}

export async function GET() {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  try {
    const root = getUploadsRoot();
    const groups = await Promise.all(
      MEDIA_FOLDERS.map(async (folder) => {
        const dir = path.join(root, folder);
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          const files = await Promise.all(
            entries
              .filter((entry) => entry.isFile())
              .map(async (entry) => {
                const stat = await fs.stat(path.join(dir, entry.name));
                return {
                  folder,
                  filename: entry.name,
                  url: publicUrl(folder, entry.name),
                  size: stat.size,
                  updatedAt: stat.mtime.toISOString(),
                  kind: isPdf(entry.name) ? 'pdf' : isImage(entry.name) ? 'image' : 'file'
                };
              })
          );
          return files.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
        } catch {
          return [];
        }
      })
    );
    return NextResponse.json({ items: groups.flat() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خواندن رسانه ممکن نشد.' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireContent();
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const folder = String(body.folder || '');
  const filename = String(body.filename || '');
  if (!MEDIA_FOLDERS.includes(folder as (typeof MEDIA_FOLDERS)[number])) {
    return NextResponse.json({ error: 'پوشه نامعتبر است.' }, { status: 400 });
  }
  if (!filename) return NextResponse.json({ error: 'نام فایل الزامی است.' }, { status: 400 });
  try {
    await safeUnlink(folder, filename);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'حذف ناموفق بود.' }, { status: 400 });
  }
}
