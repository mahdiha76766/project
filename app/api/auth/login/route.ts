import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { SESSION_TTL_SECONDS, signToken } from '@/lib/auth/token';
import { loginSchema } from '@/lib/validation/auth';
import { normalizeMobile } from '@/lib/validation/mobile';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyCaptchaFromBody } from '@/lib/captcha/verify-request';
import { logError, logInfo } from '@/lib/monitoring/logger';
import { maskMongoUri, resolveMongoUri, serializeMongoError } from '@/lib/db/mongo-config';

const INVALID_CREDENTIALS = 'شماره موبایل یا رمز عبور اشتباه است';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    const rate = checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!rate.allowed) {
      logInfo('auth.login.rate_limited', { ip });
      return NextResponse.json({ error: 'تعداد تلاش زیاد است، کمی بعد تلاش کنید' }, { status: 429 });
    }

    const raw = await req.json();

    const captcha = await verifyCaptchaFromBody(raw, 'login');
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const rawMobile = String(raw.mobile || '');
    const normalizedMobile = normalizeMobile(rawMobile);

    logInfo('auth.login.attempt', {
      ip,
      rawMobileLength: rawMobile.length,
      normalizedMobile: normalizedMobile.replace(/\d{4}$/, '****')
    });

    const { mobile, password } = loginSchema.parse({
      mobile: normalizedMobile,
      password: String(raw.password || '')
    });

    const mongoCfg = resolveMongoUri();
    logInfo('auth.login.db_connect', {
      ip,
      source: mongoCfg.source,
      uriMasked: maskMongoUri(mongoCfg.uri),
      dbName: mongoCfg.dbName ?? null
    });

    await connectToDatabase();

    logInfo('auth.login.db_query', { ip, collection: 'users', filter: 'mobile' });
    const user = await User.findOne({ mobile }).select('+password');

    if (!user) {
      logInfo('auth.login.user_not_found', { ip, mobile: mobile.replace(/\d{4}$/, '****') });
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    if (user.isBlocked) {
      logInfo('auth.login.blocked', { ip, userId: String(user._id) });
      return NextResponse.json({ error: 'حساب کاربری مسدود شده است' }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      logInfo('auth.login.bad_password', { ip, userId: String(user._id) });
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    const token = await signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set('session_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TTL_SECONDS
    });

    logInfo('auth.login.success', { ip, userId: String(user._id), role: user.role });
    return res;
  } catch (error) {
    if (error instanceof ZodError) {
      logInfo('auth.login.validation_failed', {
        ip,
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      });
      const first = error.issues[0]?.message;
      return NextResponse.json({ error: first || 'شماره موبایل یا رمز عبور معتبر نیست.' }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      logError('auth.login.bad_json', { ip, message: error.message });
      return NextResponse.json({ error: 'درخواست JSON نامعتبر است.' }, { status: 400 });
    }
    const mongoErr = serializeMongoError(error);
    const mongoCfg = resolveMongoUri();
    logError('auth.login.error', {
      ip,
      uriMasked: maskMongoUri(mongoCfg.uri),
      dbName: mongoCfg.dbName ?? null,
      host: mongoCfg.host ?? null,
      ...mongoErr
    });

    const code = typeof mongoErr.code === 'number' ? mongoErr.code : null;
    const hint =
      code === 13
        ? 'دسترسی MongoDB رد شد — نام دیتابیس یا authSource را بررسی کنید (باید nedicon1_web باشد)'
        : 'اتصال به دیتابیس برقرار نشد — لاگ سرور را بررسی کنید';

    return NextResponse.json({ error: hint }, { status: 503 });
  }
}
