import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as any;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const filename = file.name ?? `upload-${Date.now()}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    await fs.mkdir(uploadsDir, { recursive: true });
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/blog/${uniqueName}`;
    return NextResponse.json({ url, filename: uniqueName });
  } catch (err) {
    console.error('Upload error', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
