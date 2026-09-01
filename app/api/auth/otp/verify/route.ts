import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { SESSION_TTL_SECONDS, signToken } from '@/lib/auth/token';
import { verifyOtp } from '@/lib/sms/otp-service';
import { normalizeMobile, isValidMobile } from '@/lib/validation/mobile';
import { registerSchema } from '@/lib/validation/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mobile = normalizeMobile(String(body.mobile || ''));
    const code = String(body.code || '').trim();
    const purpose = body.purpose === 'register' ? 'register' : 'login';

    if (!isValidMobile(mobile) || !code) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const verified = await verifyOtp({ mobile, code, purpose });
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }

    await connectToDatabase();

    if (purpose === 'login') {
      const user = await User.findOne({ mobile }).select('+password');
      if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
      if (user.isBlocked) return NextResponse.json({ error: 'حساب مسدود است' }, { status: 403 });

      user.mobileVerified = true;
      await user.save();

      const token = await signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
      const res = NextResponse.json({ ok: true, role: user.role });
      res.cookies.set('session_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_TTL_SECONDS
      });
      return res;
    }

    const payload = verified.payload;
    if (!payload?.name || !payload.email) {
      return NextResponse.json({ error: 'اطلاعات ثبت‌نام ناقص است. دوباره ثبت‌نام کنید.' }, { status: 400 });
    }

    const password = payload.password || crypto.randomBytes(16).toString('hex');
    const parsed = registerSchema.safeParse({
      name: payload.name,
      mobile,
      email: payload.email,
      password
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'اطلاعات ثبت‌نام نامعتبر است';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const exists = await User.findOne({ $or: [{ mobile }, { email: parsed.data.email }] }).select('_id');
    if (exists) return NextResponse.json({ error: 'کاربر قبلاً ثبت‌نام کرده است' }, { status: 409 });

    const user = await User.create({ ...parsed.data, role: 'CUSTOMER', mobileVerified: true });

    const token = await signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
    const res = NextResponse.json({ ok: true, role: user.role, id: user._id }, { status: 201 });
    res.cookies.set('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'خطا در تأیید کد' }, { status: 500 });
  }
}
