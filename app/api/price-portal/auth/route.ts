import { NextResponse } from 'next/server';
import { verifyMathCaptchaAnswer } from '@/lib/captcha/math-captcha';
import { loginPricePortal, logoutPricePortal, verifyPricePortalAccess } from '@/lib/price-portal/auth';
import {
  assertSameOrigin,
  auditLoginAttempt,
  checkPortalLoginRate,
  clearFailedLogins,
  getClientIp,
  loginBackoffMs,
  registerFailedLogin
} from '@/lib/price-portal/security';

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'درخواست نامعتبر' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rate = checkPortalLoginRate(ip);
  if (!rate.allowed) {
    auditLoginAttempt({ ip, ok: false, reason: 'rate_limited' });
    return NextResponse.json(
      { error: 'تلاش‌های زیاد. چند دقیقه بعد دوباره امتحان کنید.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const password = typeof body.password === 'string' ? body.password : '';

    const captcha = await verifyMathCaptchaAnswer(
      String(body.captchaToken || ''),
      body.captchaAnswer
    );
    if (!captcha.ok) {
      registerFailedLogin(ip);
      auditLoginAttempt({ ip, ok: false, reason: 'captcha' });
      return NextResponse.json({ error: captcha.error || 'کپچا نامعتبر است' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'رمز عبور را وارد کنید.' }, { status: 400 });
    }

    const delay = await loginBackoffMs(ip);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));

    const result = await loginPricePortal(password);
    if (!result.ok) {
      registerFailedLogin(ip);
      auditLoginAttempt({ ip, ok: false, reason: 'bad_password' });
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    clearFailedLogins(ip);
    auditLoginAttempt({ ip, ok: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'خطا در ورود' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'درخواست نامعتبر' }, { status: 403 });
  }
  await logoutPricePortal();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const access = await verifyPricePortalAccess();
  return NextResponse.json({ authed: access.ok });
}
