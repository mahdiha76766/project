import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/guards';
import {
  getPricePortalSettings,
  savePricePortalSettings
} from '@/lib/admin/price-portal-settings';

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const settings = await getPricePortalSettings();
  return NextResponse.json({
    settings: {
      enabled: settings.enabled,
      pathSlug: settings.pathSlug,
      hasPassword: Boolean(settings.passwordHash)
    }
  });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = await req.json();
    const current = await getPricePortalSettings();
    const saved = await savePricePortalSettings(
      {
        enabled: Boolean(body.enabled),
        pathSlug: String(body.pathSlug || ''),
        password: typeof body.password === 'string' ? body.password : undefined
      },
      current
    );

    return NextResponse.json({
      settings: {
        enabled: saved.enabled,
        pathSlug: saved.pathSlug,
        hasPassword: Boolean(saved.passwordHash)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
