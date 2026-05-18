import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import fs from 'fs/promises';
import path from 'path';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

const normalizeStoredPath = (p: string) => (p.startsWith('/') ? p : `/${p}`);

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'فرمت تصویر مجاز نیست.' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'حجم تصویر باید کمتر از ۲ مگابایت باشد.' }, { status: 400 });

    const filename = file.name ?? `category-${Date.now()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const relativeDir = path.join('uploads', 'categories');
    const uploadsDir = path.join(process.cwd(), 'public', relativeDir);
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueName = `${Date.now()}-${safeName}`;
    const relativePath = path.join(relativeDir, uniqueName).replaceAll('\\', '/');
    await fs.writeFile(path.join(uploadsDir, uniqueName), buffer);

    return NextResponse.json({ url: normalizeStoredPath(relativePath), filename: uniqueName });
  } catch (error) {
    console.error('Category upload error', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
