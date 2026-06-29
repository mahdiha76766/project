import { NextResponse } from 'next/server';
import { createBackupZip, deleteTempFile } from '@/lib/admin/backup';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/api/guards';

export async function GET() {
  const adminGuard = await requireAdmin();
  if (adminGuard.error) return adminGuard.error;

  try {
    const filePath = await createBackupZip();

    // Stream instead of loading to memory
    const stream = fs.createReadStream(filePath);

    // Read stream natively with Web Streams API
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => {
          controller.close();
          deleteTempFile(filePath);
        });
        stream.on('error', (err) => {
          controller.error(err);
          deleteTempFile(filePath);
        });
      }
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error: any) {
    console.error('Download Backup API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
