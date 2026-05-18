import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import fs from 'fs/promises';
import path from 'path';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const formData = await req.formData();
    const file = formData.get('file') as any;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const filename = file.name ?? `category-${Date.now()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueName = `${Date.now()}-${safeName}`;
    await fs.writeFile(path.join(uploadsDir, uniqueName), buffer);

    return NextResponse.json({ url: `/uploads/categories/${uniqueName}`, filename: uniqueName });
  } catch (error) {
    console.error('Category upload error', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
