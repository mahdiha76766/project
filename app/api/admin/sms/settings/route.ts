import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { getSmsSettings, saveSmsSettings, defaultSmsSettings, normalizeSmsSettings } from '@/lib/admin/sms-settings';
import { getSmsCredit, getSmsLines } from '@/lib/sms/sms-service';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const settings = await getSmsSettings();
  const credit = await getSmsCredit().catch(() => ({ ok: false as const, error: 'خطا' }));
  const lines = await getSmsLines().catch(() => ({ ok: false as const, error: 'خطا' }));
  return NextResponse.json({
    settings,
    credit: credit.ok ? credit.credit : null,
    creditError: credit.ok ? null : credit.error,
    lines: lines.ok ? lines.lines : [],
    linesError: lines.ok ? null : lines.error
  });
}

export async function PUT(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const settings = normalizeSmsSettings(body.settings ?? body);
    const saved = await saveSmsSettings(settings);
    return NextResponse.json({ settings: saved });
  } catch {
    return NextResponse.json({ error: 'ذخیره تنظیمات ناموفق بود' }, { status: 400 });
  }
}

export async function POST() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return NextResponse.json({ settings: defaultSmsSettings });
}
