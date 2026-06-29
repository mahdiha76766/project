import { NextResponse } from 'next/server';
import { restoreFromZip } from '@/lib/admin/backup';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/api/guards';

export async function POST(req: Request) {
  const adminGuard = await requireAdmin();
  if (adminGuard.error) return adminGuard.error;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    const tempFilePath = path.join(process.cwd(), 'temp-backups', `upload-${Date.now()}.zip`);

    // Ensure directory exists
    fs.mkdirSync(path.join(process.cwd(), 'temp-backups'), { recursive: true });

    // Stream instead of loading to memory
    const writableStream = fs.createWriteStream(tempFilePath);
    if (!file.stream) {
      throw new Error("File stream not available");
    }
    const reader = file.stream().getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      writableStream.write(Buffer.from(value));
    }
    writableStream.end();

    // wait for write to finish before restoring
    await new Promise<void>((resolve) => writableStream.on('finish', () => resolve()));

    await restoreFromZip(tempFilePath);

    // Clean up
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({ ok: true, data: { message: 'Restore completed successfully' } });
  } catch (error: any) {
    console.error('Restore Backup API error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'An error occurred during restore' }, { status: 500 });
  }
}
