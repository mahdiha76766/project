import { NextResponse } from 'next/server';
import { getBackupSettings, saveBackupSettings } from '@/lib/admin/backup-config';
import { createBackupZip, uploadToGoogleDrive, deleteTempFile, initializeCronJob } from '@/lib/admin/backup';
import { requireAdmin } from '@/lib/api/guards';

export async function GET() {
  const adminGuard = await requireAdmin();
  if (adminGuard.error) return adminGuard.error;

  const settings = getBackupSettings();
  return NextResponse.json({ ok: true, data: { settings } });
}

export async function POST(req: Request) {
  const adminGuard = await requireAdmin();
  if (adminGuard.error) return adminGuard.error;

  try {
    const body = await req.json();

    if (body.action === 'save_settings') {
      const updated = saveBackupSettings(body.settings);
      initializeCronJob();
      return NextResponse.json({ ok: true, data: { settings: updated } });
    }

    if (body.action === 'backup_google_drive') {
      const filePath = await createBackupZip();
      await uploadToGoogleDrive(filePath);
      deleteTempFile(filePath);
      return NextResponse.json({ ok: true, data: { message: 'Backup successfully uploaded to Google Drive' } });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Backup API error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'An error occurred' }, { status: 500 });
  }
}
