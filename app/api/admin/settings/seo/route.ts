import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import {
  getSiteSeoSettings,
  normalizeSiteSeoSettings,
  saveSiteSeoSettings,
  type SiteSeoSettings
} from '@/lib/admin/site-settings';

export async function GET() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const settings = await getSiteSeoSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const settings = normalizeSiteSeoSettings(body.settings ?? body);
  await saveSiteSeoSettings(settings as SiteSeoSettings);
  return NextResponse.json({ ok: true, settings });
}
