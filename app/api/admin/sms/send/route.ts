import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { hasMinimumRole } from '@/server/permissions';
import { sendManualSms, sendBulkCouponSms } from '@/lib/sms/sms-service';
import { normalizeMobile } from '@/lib/validation/mobile';

async function guard() {
  const user = await getSessionUser();
  return user && hasMinimumRole(user.role, 'ADMIN');
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const user = await getSessionUser();
    const body = await req.json();
    const mode = body.mode === 'coupon' ? 'coupon' : 'single';

    const rawMobiles: string[] = Array.isArray(body.mobiles)
      ? body.mobiles
      : String(body.mobiles || body.mobile || '')
          .split(/[\n,،;]/)
          .map((s: string) => s.trim())
          .filter(Boolean);

    const mobiles = rawMobiles.map(normalizeMobile).filter(Boolean);
    if (!mobiles.length) return NextResponse.json({ error: 'حداقل یک شماره موبایل وارد کنید' }, { status: 400 });

    if (mode === 'coupon') {
      const couponCode = String(body.couponCode || '').trim();
      if (!couponCode) return NextResponse.json({ error: 'کد تخفیف الزامی است' }, { status: 400 });
      const result = await sendBulkCouponSms({
        mobiles,
        couponCode,
        messageTemplate: body.messageTemplate ? String(body.messageTemplate) : undefined,
        sentBy: user?.userId
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json(result);
    }

    const message = String(body.message || '').trim();
    if (!message) return NextResponse.json({ error: 'متن پیامک الزامی است' }, { status: 400 });

    const result = await sendManualSms({ mobiles, message, sentBy: user?.userId });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'ارسال ناموفق بود' }, { status: 400 });
  }
}
