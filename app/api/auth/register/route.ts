import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { registerSchema } from '@/lib/validation/auth';
import { normalizeMobile } from '@/lib/validation/mobile';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { verifyCaptchaFromBody } from '@/lib/captcha/verify-request';
import { logError, logInfo } from '@/lib/monitoring/logger';
import { maskMongoUri, resolveMongoUri, serializeMongoError } from '@/lib/db/mongo-config';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    const rate = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!rate.allowed) {
      logInfo('auth.register.rate_limited', { ip });
      return NextResponse.json({ error: 'تعداد درخواست زیاد است، کمی بعد تلاش کنید' }, { status: 429 });
    }

    const raw = await req.json();

    const captcha = await verifyCaptchaFromBody(raw, 'register');
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }

    const rawMobile = String(raw.mobile || '');
    const normalizedMobile = normalizeMobile(rawMobile);

    logInfo('auth.register.attempt', {
      ip,
      rawMobileLength: rawMobile.length,
      normalizedMobile: normalizedMobile.replace(/\d{4}$/, '****')
    });

    const body = registerSchema.parse({
      name: String(raw.name || ''),
      mobile: normalizedMobile,
      email: String(raw.email || ''),
      password: String(raw.password || '')
    });

    const mongoCfg = resolveMongoUri();
    logInfo('auth.register.db_connect', {
      ip,
      source: mongoCfg.source,
      uriMasked: maskMongoUri(mongoCfg.uri),
      dbName: mongoCfg.dbName ?? null
    });

    await connectToDatabase();

    logInfo('auth.register.db_query', { ip, collection: 'users', filter: 'mobile|email' });
    const exists = await User.findOne({ $or: [{ mobile: body.mobile }, { email: body.email }] }).select('_id mobile email');
    if (exists) {
      logInfo('auth.register.duplicate', { ip, mobile: body.mobile.replace(/\d{4}$/, '****') });
      return NextResponse.json({ error: 'کاربر با این شماره یا ایمیل قبلاً ثبت‌نام کرده است' }, { status: 409 });
    }

    const user = await User.create({ ...body, role: 'CUSTOMER' });

    logInfo('auth.register.success', { ip, userId: String(user._id), role: user.role });
    return NextResponse.json({ id: user._id, mobile: user.mobile, role: user.role }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      logInfo('auth.register.validation_failed', {
        ip,
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      });
      const first = error.issues[0]?.message;
      return NextResponse.json({ error: first || 'اطلاعات واردشده صحیح نیست.' }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      logError('auth.register.bad_json', { ip, message: error.message });
      return NextResponse.json({ error: 'درخواست JSON نامعتبر است.' }, { status: 400 });
    }
    const mongoErr = serializeMongoError(error);
    const mongoCfg = resolveMongoUri();
    logError('auth.register.error', {
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
        : 'خطا در ارتباط با سرور/دیتابیس — لاگ سرور را بررسی کنید';

    return NextResponse.json({ error: hint }, { status: 503 });
  }
}
