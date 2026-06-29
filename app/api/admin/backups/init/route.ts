import { NextResponse } from 'next/server';
import { initializeCronJob } from '@/lib/admin/backup';

let initialized = false;

import { requireAdmin } from '@/lib/api/guards';

export async function POST() {
  const adminGuard = await requireAdmin();
  if (adminGuard.error) return adminGuard.error;

  if (!initialized) {
    try {
      initializeCronJob();
      initialized = true;
    } catch (e) {
      console.error('Failed to init cron:', e);
    }
  }
  return NextResponse.json({ ok: true });
}
