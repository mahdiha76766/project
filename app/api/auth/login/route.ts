import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { User } from '@/models';
import { connectToDatabase } from '@/lib/db/mongoose';
import { signToken } from '@/lib/auth/token';
import { loginSchema } from '@/lib/validation/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

const normalizeMobile = (value: string) =>
  value
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s|-/g, '');

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rate = checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!rate.allowed) return NextResponse.json({ error: 'تعداد تلاش زیاد است، کمی بعد تلاش کنید' }, { status: 429 });

    const raw = await req.json();
    const { mobile, password } = loginSchema.parse({
      mobile: normalizeMobile(String(raw.mobile || '')),
      password: raw.password
    });

    await connectToDatabase();
    const user = await User.findOne({ mobile }).select('+password');
    if (!user) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return NextResponse.json({ error: 'رمز عبور اشتباه است' }, { status: 401 });
    const token = signToken({ userId: String(user._id), role: user.role, mobile: user.mobile });
    const res = NextResponse.json({ ok: true });
    res.cookies.set('session_token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
    return res;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'شماره موبایل یا رمز عبور معتبر نیست.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'اتصال به دیتابیس برقرار نشد. تنظیمات MONGODB_URI را بررسی کنید.' }, { status: 503 });
  }
}
