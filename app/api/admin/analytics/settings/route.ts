import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/guards';
import { getAnalyticsSettings, saveAnalyticsSettings } from '@/lib/admin/analytics-settings';
import { getCaptchaSettings, saveCaptchaSettings } from '@/lib/admin/captcha-settings';
import { normalizeAnalyticsSettings } from '@/lib/admin/analytics-settings-config';
import { normalizeCaptchaSettings } from '@/lib/admin/captcha-settings-config';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const [analytics, captcha] = await Promise.all([getAnalyticsSettings(), getCaptchaSettings()]);
  return NextResponse.json({ analytics, captcha });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json();
  if (body.analytics) {
    await saveAnalyticsSettings(normalizeAnalyticsSettings(body.analytics));
  }
  if (body.captcha) {
    await saveCaptchaSettings(normalizeCaptchaSettings(body.captcha));
  }

  const [analytics, captcha] = await Promise.all([getAnalyticsSettings(), getCaptchaSettings()]);
  return NextResponse.json({ ok: true, analytics, captcha });
}
