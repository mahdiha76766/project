import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { syncAllPortalProductsToExcel } from '@/lib/admin/product-excel-full-sync';

async function guard() {
  const user = await getSessionUser();
  if (!user || !hasMinimumRole(user.role, 'ADMIN')) return null;
  return user;
}

/** بازنویسی اکسل از وضعیت فعلی پورتال قیمت */
export async function POST() {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const sync = await syncAllPortalProductsToExcel();
    if (!sync.ok) {
      return NextResponse.json({ ok: false, error: sync.reason, sync }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sync });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در همگام‌سازی اکسل';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
