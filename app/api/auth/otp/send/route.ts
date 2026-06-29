import { NextResponse } from 'next/server';
import { getOtpConfig, sendOtp } from '@/lib/sms/otp-service';
import { normalizeMobile, isValidMobile } from '@/lib/validation/mobile';
import { verifyCaptchaFromBody } from '@/lib/captcha/verify-request';

export async function GET() {
  const config = await getOtpConfig();
  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    const body = await req.json();
    const purpose = body.purpose === 'register' ? 'register' : 'login';

    const captcha = await verifyCaptchaFromBody(body, purpose === 'register' ? 'register' : 'otpSend');
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const mobile = normalizeMobile(String(body.mobile || ''));

    if (!isValidMobile(mobile)) {
      return NextResponse.json({ error: 'شماره موبایل معتبر نیست' }, { status: 400 });
    }

    const registerPayload =
      purpose === 'register'
        ? {
            name: String(body.name || '').trim(),
            email: String(body.email || '').trim().toLowerCase(),
            password: body.password ? String(body.password) : undefined
          }
        : undefined;

    const result = await sendOtp({ mobile, purpose, ip, registerPayload });
    if (!result.ok) {
      const status =
        result.error?.includes('یافت نشد') ? 404 :
        result.error?.includes('قبلاً') ? 409 :
        result.error?.includes('ثانیه') ? 429 : 400;
      return NextResponse.json(
        { error: result.error, retryAfter: 'retryAfter' in result ? result.retryAfter : undefined },
        { status }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'درخواست نامعتبر است' }, { status: 400 });
  }
}
